import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from "@angular/core";
import { DeckService, CardChanged } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { DeckUtilsService } from "../services/deck.utils.service";
import { DeckInflated, Card, CollectionChangeStatus } from "../../interfaces/index";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { ConfigService, cardStyles } from "../services/config.service";

import "../rxjs-operators";

@Component({
    //moduleId: module.id,
    selector: "deck",
    templateUrl: "deck.component.html",
})
export class DeckComponent implements OnInit, OnDestroy {
    @Input()
    deck: DeckInflated;
    @Input()
    hideDetails = true;
    @Input()
    hideTitle = false;
    @Input()
    showManaCurve = false;
    @Input()
    disableCardChangedListener = false;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    cardChangedSubscription: Subscription;
    title: string;
    sortOptions = SortOptions;
    filter: CardPipeArg;
    auth: boolean;
    form: FormGroup;
    cardStyle = cardStyles;

    constructor(
        private deckService: DeckService,
        private authService: AuthService,
        private configService: ConfigService,
        private utils: DeckUtilsService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.updateTitle();
        this.auth = this.authService.isAuthenticated();
        this.filter = {
            hideAvailable: false,
            sort: SortOptions.classic,
            mana: 0
        };

        this.form = this.fb.group({
            "userCollection": this.deck.userCollection,
            "orderBy": this.filter.sort
        });

        (this.form.get("userCollection").valueChanges as Observable<boolean>)
            .debounceTime(200)
            .switchMap(val => this.deckService.toggleUserDeck(this.deck.id, val))
            .subscribe((rez: CollectionChangeStatus) => {
                if (this.deck.deleted || rez.deckDeleted) {
                    this.onDeleteDeck.emit(this.deck.id);
                }
            });

        (this.form.get("orderBy").valueChanges as Observable<SortOptions>).subscribe(v => this.changeSort(+v));
        if (!this.disableCardChangedListener) {
            this.cardChangedSubscription = this.deckService.cardChanged.subscribe(cardChanged => this.updateDeck(cardChanged));
        }
    }
    ngOnDestroy() {
        if (this.cardChangedSubscription) {
            this.cardChangedSubscription.unsubscribe();
        }
    }

    changeAvailability() {
        this.filter = {
            hideAvailable: !this.filter.hideAvailable,
            sort: this.filter.sort,
            mana: 0
        };
    }
    changeSort(sort: SortOptions) {
        this.filter = {
            hideAvailable: this.filter.hideAvailable,
            sort: sort,
            mana: 0
        };
    }

    style() {
        return this.configService.config.cardStyle;
    }

    private updateDeck(cardChanged: CardChanged) {
        if (!this.utils.updateDeckStats(this.deck, cardChanged)) {
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
