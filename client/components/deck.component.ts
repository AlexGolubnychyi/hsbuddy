import { Component, Input, Output, OnInit, OnChanges, EventEmitter, ChangeDetectionStrategy, SimpleChanges } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { CardHashService } from "../services/card-hash.service";
import { DeckUtilsService } from "../services/deck-utils.service";
import { PseudoDeck, Card, Deck } from "../../interfaces/index";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { Config, cardStyles, ConfigService } from "../services/config.service";
import "../rxjs-operators";

@Component({
    moduleId: module.id,
    selector: "deck",
    templateUrl: "deck.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckComponent implements OnInit, OnChanges {
    @Input()
    deck: PseudoDeck<Card> | Deck<Card>;
    @Input()
    hideDetails = true;
    @Input()
    replaceTitle = false;
    @Input()
    showManaCurve = false;
    @Input()
    config: Config;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    sortOptions = SortOptions;
    filter: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.classic,
        mana: 0
    };
    auth: boolean;
    cardStyles = cardStyles;

    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private cardHash: CardHashService,
        public utils: DeckUtilsService
    ) { }

    ngOnInit() {
        this.auth = this.authService.isAuthenticated();
    }

    ngOnChanges(changes: SimpleChanges) {
        //console.log(`deck-changed: ${this.deck.name}`, changes);
        this.utils.updateDeckStats(this.deck);
        this.updateCardListFilter(); //trigger update in card list
    }

    changeAvailability() {
        this.filter.hideAvailable = !this.filter.hideAvailable;
        this.updateCardListFilter();
    }

    changeSort(sort: SortOptions) {
        this.filter.sort = sort;
        this.updateCardListFilter();
    }

    listStyleChanged(split: boolean) {
        this.configService.config = Object.assign(this.config, {
            splitCardListByClass: split
        });
    }

    private updateCardListFilter() {
        this.filter = Object.assign({}, this.filter);
    }
}
