import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DeckService, CardChanged } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { ConfigService, cardStyles } from "../services/config.service";
import { CardHashService } from "../services/card.hash.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck.utils.service";
import { Observable } from "rxjs/Observable";
import { DeckComponent } from "./deck.component";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { RootComponentBase } from "./root.component.base";

@Component({
    //moduleId: module.id,
    selector: "selector",
    templateUrl: "deck.detail.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckDetailComponent extends RootComponentBase {
    deck: contracts.Deck<contracts.Card>;
    similarDecks: contracts.DeckDiff<contracts.Card>[];
    loading: boolean;
    loadingSimilarDecks: boolean;
    form: FormGroup;
    edit = false;
    editError: string;
    confirmDeletion = false;
    cardFilterOpts: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.classic,
        mana: 0
    };

    @ViewChild(DeckComponent) deckComponent: DeckComponent;

    constructor(
        deckService: DeckService,
        configService: ConfigService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService,
        private fb: FormBuilder,
        private ref: ChangeDetectorRef
    ) { super(configService, deckService); }

    ngOnInit() {
        super.ngOnInit();
        this.loading = true;

        this.form = this.fb.group({
            name: ["", Validators.required],
            date: ["", Validators.required]
        });

        this.route.params
            .map(params => params["id"])
            .switchMap<contracts.Deck<contracts.Card>>(id => this.deckService.getDeck(id))
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
                this.ref.markForCheck();
            });
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
                this.ref.markForCheck();
                this.loadingSimilarDecks = false;
                if (similarDecks) {
                    this.similarDecks = similarDecks;
                }
            });
    }

    change() {
        this.deckService.setDescription(this.deck.id, <contracts.DeckChange>this.form.value).subscribe(result => {
            this.ref.markForCheck();
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
                this.ref.markForCheck();
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
        return this.config.cardStyle === cardStyles.textOnly;
    }

    protected onCardChanged(cardChanged: CardChanged) {
        this.updateDecks();
        if (this.deck.cards.some(c => c.card.id === cardChanged.cardId)) {
            this.deck = Object.assign({}, this.deck);
        }
        this.ref.markForCheck();
    };

    protected onConfigChanged() {
        this.ref.markForCheck();
    };

    private updateDecks() {
        this.utils.updateDeckStats(this.deck);
        if (this.similarDecks) {
            this.similarDecks.forEach(sm => this.utils.updateDeckDiffStats(sm));
        }
    }

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
    }
}