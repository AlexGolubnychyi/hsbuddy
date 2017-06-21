import { Component, Input, Output, OnInit, OnChanges, EventEmitter, ChangeDetectionStrategy, SimpleChanges, ChangeDetectorRef } from "@angular/core";
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
    deckCopyInProgress = false;
    cardStyles = cardStyles;

    canUseClipboard = false;

    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private cardHash: CardHashService,
        private ref: ChangeDetectorRef,
        public utils: DeckUtilsService
    ) { }

    ngOnInit() {
        this.auth = this.authService.isAuthenticated();
        try {
            this.canUseClipboard = document.queryCommandSupported("copy") && !navigator.userAgent.match(/ipad|ipod|iphone/i);
        }
        catch (e) { }
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
        this.configService.config = { ...this.config, splitCardListByClass: split };
    }

    copyDeck() {
        let text = (this.deck as Deck<Card>).name || "";
        text = text ? `###${text}\n\n${this.deck.importCode}` : this.deck.importCode;

        if (!this.setClipboardText(text)) {
            this.canUseClipboard = false;
            return;
        }

        this.deckCopyInProgress = true;
        setTimeout(() => {
            this.deckCopyInProgress = false;
            this.ref.markForCheck();
        }, 1000);
    }



    private updateCardListFilter() {
        this.filter = Object.assign({}, this.filter);
    }


    private setClipboardText(text: string) {
        let textArea = document.createElement("textarea");
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        let success = false;
        try {
            success = document.execCommand("copy");
        } catch (err) { }

        document.body.removeChild(textArea);
        if (!success) {
            console.log("unable to copy");
        }
        return success;
    }
}
