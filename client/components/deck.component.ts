import { Component, Input, Output, OnInit, OnChanges, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { ApiService } from "../services/api.service";
import { AuthService } from "../services/auth.service";
import { CardHashService } from "../services/card.hash.service";
import { DeckUtilsService } from "../services/deck-utils.service";
import { Deck, CollectionChangeStatus, Card } from "../../interfaces/index";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Observable } from "rxjs/Observable";
import { Config, cardStyles } from "../services/config.service";


import "../rxjs-operators";

@Component({
    moduleId: module.id,
    selector: "deck",
    templateUrl: "deck.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckComponent implements OnInit, OnChanges {
    @Input()
    deck: Deck<Card>;
    @Input()
    hideDetails = true;
    @Input()
    hideTitle = false;
    @Input()
    showManaCurve = false;
    @Input()
    config: Config;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    title: string;
    sortOptions = SortOptions;
    filter: CardPipeArg;
    auth: boolean;
    form: FormGroup;
    cardStyles = cardStyles;

    constructor(
        private deckService: ApiService,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private cardHash: CardHashService,
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
    }

    ngOnChanges(changes) {
        //console.log(`deck-changed: ${this.deck.name}`, changes);
        this.utils.updateDeckStats(this.deck);
        this.updateTitle();
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

    private updateTitle() {
        if (this.hideTitle) {
            return;
        }
        this.title = this.utils.getDeckTitle(this.deck);
    }

}
