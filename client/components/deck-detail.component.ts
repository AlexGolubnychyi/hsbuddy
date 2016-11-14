import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService, CardChanged } from "../services/api.service";
import { AuthService } from "../services/auth.service";
import { ConfigService, cardStyles } from "../services/config.service";
import { CardHashService } from "../services/card-hash.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck-utils.service";
import { Observable } from "rxjs/Observable";
import { DeckComponent } from "./deck.component";
import { CardPipeArg, SortOptions } from "../pipes/card.pipe";
import { BaseComponent } from "./base.component";


@Component({
    moduleId: module.id,
    selector: "selector",
    templateUrl: "deck-detail.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckDetailComponent extends BaseComponent implements OnInit, OnDestroy {
    deck: contracts.Deck<contracts.Card>;
    similarDecks: contracts.DeckDiff<contracts.Card>[];
    loading: boolean;
    loadingSimilarDecks: boolean;
    form: FormGroup;
    edit = false;
    editError: string;
    upgrading = false;
    upgradeUrl = "";
    confirmDeletion = false;
    cardFilterOpts: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.classic,
        mana: 0
    };

    @ViewChild(DeckComponent) deckComponent: DeckComponent;

    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService,
        private fb: FormBuilder,
        private ref: ChangeDetectorRef
    ) { super(configService, apiService); }

    ngOnInit() {
        super.ngOnInit();
        this.loading = true;

        this.form = this.fb.group({
            name: ["", Validators.required],
            date: ["", Validators.required]
        });

        this.route.params
            .map(params => params["id"] as string)
            .switchMap(id => this.apiService.getDeck(id))
            .subscribe(deck => {
                if (!deck) {
                    this.router.navigateByUrl("/");
                }
                this.deck = deck;
                this.cancelEdit();
                this.loading = false;
                this.similarDecks = null;
                if (this.deckComponent) {
                    this.deckComponent.hideDetails = false;
                }
                this.setDefaults();
                this.ref.markForCheck();
            });
    }

    ngDestroy() {
        super.ngOnDestroy();
    }

    toggleSimilarDecks() {
        if (this.similarDecks) {
            this.similarDecks = null;
            return;
        }
        this.loadingSimilarDecks = true;

        this.apiService.getSimilar(this.deck.id)
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

    startEdit() {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.edit = true;
    }

    change() {
        this.apiService.setDescription(this.deck.id, <contracts.DeckChange>this.form.value).subscribe(result => {
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
            ? this.apiService.toggleUserDeck(this.deck.id, false)
            : Observable.of({ success: true }))
            .do<contracts.CollectionChangeStatus>(result => this.loading = result.success)
            .filter(result => result.success)
            .switchMap(() => this.apiService.deleteDeck(this.deck.id))
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

    onSimilarDeckDeleted(deckId: string) {
        //do something I guess..
    }

    cancelEdit() {
        this.editError = null;
        this.setDefaults();
        this.edit = false;
        this.confirmDeletion = false;
        this.upgrading = false;
    }

    textOnlyMode() {
        return this.config.cardStyle === cardStyles.textOnly;
    }

    upgrade() {
        if (!this.upgrading) {
            this.upgrading = true;
            return;
        }
        this.editError = "";
        this.loading = true;
        this.apiService
            .upgradeDeck({ deckId: this.deck.id, url: this.upgradeUrl })
            .subscribe(result => {
                if (result.status !== contracts.ParseStatus.success) {
                    let failed = result.status === contracts.ParseStatus.fail;
                    this.editError = `failed to upgrade: ${failed ? result.error : contracts.ParseStatus[result.status]}`;
                    this.ref.markForCheck();
                    this.loading = false;
                    return null;
                }
                this.router.navigateByUrl(`/deck/${result.deckId}`);
            });
    }

    revIdentity(index: number, rev: contracts.DeckRevision<contracts.Card>) {
        return rev.number;
    }

    protected onCardChanged(cardChanged: CardChanged) {
        this.utils.updateDeckStats(this.deck);

        if (this.containsChangedCard(this.deck.cards, cardChanged)) {
            this.deck = Object.assign({}, this.deck); //trigger deck changes check
        }
        if (this.similarDecks) {
            this.similarDecks.forEach(sd => {
                this.utils.updateDeckDiffStats(sd);
                if (this.containsChangedCard(sd.deck.cards, cardChanged)) {
                    sd.deck = Object.assign({}, sd.deck);
                }
            });
        }
        if (this.deck.revisions) {
            this.deck.revisions = this.deck.revisions.map(rev => {
                if (this.containsChangedCard(rev.cards, cardChanged)) {
                    return Object.assign({}, rev);
                }
                return rev;
            });
        }
        this.ref.markForCheck();
    };

    private containsChangedCard(cards: contracts.CardCount<contracts.Card>[], cardChanged: CardChanged) {
        return cards.some(c => c.card.id === cardChanged.cardId);
    }

    protected onConfigChanged() {
        //trigger global redraw
        this.deck = Object.assign({}, this.deck);
        if (this.similarDecks) {
            this.similarDecks.forEach(sd => {
                sd.deck = Object.assign({}, sd.deck);
            });
        }
        if (this.deck.revisions) {
            this.deck.revisions = this.deck.revisions.map(rev => {
                return Object.assign({}, rev);
            });
        }
        this.ref.markForCheck();
    };

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
        this.upgradeUrl = "";
    }


}