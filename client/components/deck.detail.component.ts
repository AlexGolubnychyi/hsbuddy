import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DeckService, CardChanged } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { ConfigService, cardStyles } from "../services/config.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck.utils.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { DeckComponent } from "./deck.component";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";


@Component({
    //moduleId: module.id,
    selector: "selector",
    templateUrl: "deck.detail.component.html"
})
export class DeckDetailComponent implements OnInit, OnDestroy {
    deck: contracts.DeckInflated;
    similarDecks: contracts.DeckDiffInflated[];
    loading: boolean;
    loadingSimilarDecks: boolean;
    form: FormGroup;
    edit = false;
    editError: string;
    confirmDeletion = false;
    cardChangedSubscription: Subscription;
    cardFilterOpts: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.classic,
        mana: 0
    };

    @ViewChild(DeckComponent) deckComponent: DeckComponent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private deckService: DeckService,
        private authService: AuthService,
        private configService: ConfigService,
        private utils: DeckUtilsService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.loading = true;

        this.form = this.fb.group({
            name: ["", Validators.required],
            date: ["", Validators.required]
        });

        this.cardChangedSubscription = this.deckService.cardChanged.subscribe(cardChanged => this.updateDecks(cardChanged));

        this.route.params
            .map(params => params["id"])
            .switchMap<contracts.DeckInflated>(id => this.deckService.getDeck(id))
            .subscribe(deck => {
                if (!deck) {
                    this.router.navigateByUrl("/");
                }
                this.deck = deck;
                this.loading = false;
                this.similarDecks = null;
                if (this.deckComponent) {
                    this.deckComponent.hideDetails = false;
                }
                this.setDefaults();
            });
    }

    ngOnDestroy() {
        if (this.cardChangedSubscription) {
            this.cardChangedSubscription.unsubscribe();
        }
    }


    toggleSimilarDecks() {
        if (this.similarDecks) {
            this.similarDecks = null;
            return;
        }
        this.loadingSimilarDecks = true;

        this.deckService.getSimilar(this.deck.id)
            .timeout(5000)
            .catch(() => Observable.of(null))
            .subscribe(similarDecks => {
                this.loadingSimilarDecks = false;
                if (similarDecks) {
                    this.similarDecks = similarDecks;
                }
            });
    }

    change() {
        this.deckService.setDescription(this.deck.id, <contracts.DeckChange>this.form.value).subscribe(result => {
            if (result) {

                this.deck.name = this.form.get("name").value;
                this.deck.dateAdded = this.form.get("date").value;
                this.cancelEdit();
                return;
            }
            this.editError = "failed to change deck description";
        });
    }
    delete() {
        if (!this.confirmDeletion) {
            this.confirmDeletion = true;
            return;
        }

        this.loading = true;
        (this.deck.userCollection
            ? this.deckService.toggleUserDeck(this.deck.id, false)
            : Observable.of(<contracts.CollectionChangeStatus>{ success: true }))
            .do(result => this.loading = result.success)
            .filter(result => result.success)
            .switchMap(() => this.deckService.deleteDeck(this.deck.id))
            .subscribe(result => {
                this.loading = false;
                if (result) {
                    this.router.navigateByUrl("/");
                    return;
                }

                this.editError = "failed to delete";
            });
    }

    onDeleteDeck(deckId: string) {
        this.router.navigateByUrl("/");
    }

    cancelEdit() {
        this.editError = null;
        this.setDefaults();
        this.edit = false;
        this.confirmDeletion = false;
    }

    textOnlyMode() {
        return this.configService.config.cardStyle === cardStyles.textOnly;
    }

    private updateDecks(cardChanged: CardChanged) {
        this.utils.updateDeckStats(this.deck, cardChanged);
        if (this.similarDecks && this.similarDecks.length) {
            this.similarDecks.forEach(sm => this.utils.updateDeckStats(sm.deck, cardChanged));
        }
        if (this.deck.revisions) {
            this.deck.revisions.forEach(rev => {
                rev.collected = rev.cards.every(c => c.card.numberAvailable >= c.count);
            });
        }
    }

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
    }
}