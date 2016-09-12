import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck.utils.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { DeckComponent } from "./deck.component";


@Component({
    //moduleId: module.id,
    selector: "selector",
    templateUrl: "deck.detail.component.html"
})
export class DeckDetailComponent implements OnInit, OnDestroy {
    deck: contracts.Deck;
    similarDecks: contracts.DeckDiff[];
    loading: boolean;
    loadingSimilarDecks: boolean;
    form: FormGroup;
    edit = false;
    editError: string;
    confirmDeletion = false;
    cardChangedSubscription: Subscription;
    @ViewChild(DeckComponent) deckComponent: DeckComponent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private deckService: DeckService,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.loading = true;

        this.form = this.fb.group({
            name: ["", Validators.required],
            date: ["", Validators.required]
        });

        this.cardChangedSubscription = this.deckService.cardChanged.subscribe(({cardId, count}) => this.updateDecks(cardId, count));

        this.route.params
            .map(params => params["id"])
            .switchMap<contracts.Deck>(id => this.deckService.getDeck(id))
            .subscribe(deck => {
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
                    this.router.navigateByUrl("/decks");
                    return;
                }

                this.editError = "failed to delete";
            });
    }

    onDeleteDeck(deckId: string) {
        this.router.navigateByUrl("/decks");
    }

    cancelEdit() {
        this.editError = null;
        this.setDefaults();
        this.edit = false;
        this.confirmDeletion = false;
    }

    private updateDecks(cardId: string, newCount: number) {
        this.utils.updateDeckStats(this.deck, cardId, newCount);
        if (this.similarDecks && this.similarDecks.length) {
            this.similarDecks.map(sm => sm.deck).forEach(d => this.utils.updateDeckStats(d, cardId, newCount));
        }
    }

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
    }
}