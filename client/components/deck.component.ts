import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from "@angular/core";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { DeckUtilsService } from "../services/deck.utils.service";
import { Deck, Card } from "../../interfaces/index";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import * as contracts from "../../interfaces/index";

import "../rxjs-operators";

@Component({
    //moduleId: module.id,
    selector: "deck",
    templateUrl: "deck.component.html",
})
export class DeckComponent implements OnInit, OnDestroy {
    @Input()
    deck: Deck;
    @Input()
    hideDetails = true;
    @Input()
    hideTitle = false;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    cards: Card[];
    cardChangedSubscription: Subscription;
    title: string;
    sortOptions = SortOptions;
    filter: CardPipeArg;
    auth: boolean;
    form: FormGroup;

    constructor(
        private deckService: DeckService,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private fb: FormBuilder
    ) {
        this.cardChangedSubscription = this.deckService.cardChanged.subscribe(({cardId, count}) => this.updateDeck(cardId, count));
    }

    ngOnInit() {
        this.updateTitle();
        this.auth = this.authService.isAuthenticated();
        this.filter = {
            hideAvailable: false,
            sort: SortOptions.classic
        };

        this.form = this.fb.group({
            "userCollection": this.deck.userCollection,
            "orderBy": this.filter.sort
        });

        (this.form.get("userCollection").valueChanges as Observable<boolean>)
            .debounceTime(200)
            .switchMap(val => this.deckService.toggleUserDeck(this.deck.id, val))
            .subscribe((rez: contracts.CollectionChangeStatus) => {
                if (this.deck.deleted || rez.deckDeleted) {
                   this.onDeleteDeck.emit(this.deck.id);
                }
            });

        (this.form.get("orderBy").valueChanges as Observable<SortOptions>).subscribe(v => this.changeSort(+v));
    }
    ngOnDestroy() {
        this.cardChangedSubscription.unsubscribe();
    }

    changeAvailability() {
        this.filter = {
            hideAvailable: !this.filter.hideAvailable,
            sort: this.filter.sort
        };
    }
    changeSort(sort: SortOptions) {
        this.filter = {
            hideAvailable: this.filter.hideAvailable,
            sort: sort
        };
    }


    private updateDeck(cardId: string, newCount: number) {
        if (!this.utils.updateDeckStats(this.deck, cardId, newCount)) {
            return;
        }
        this.updateTitle();
    }

    private updateTitle() {
        if (this.hideTitle) {
            return;
        }
        this.title = this.utils.getDeckTitle(this.deck);
    }

}
