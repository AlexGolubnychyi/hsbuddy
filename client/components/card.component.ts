import { Component, Input, OnInit } from "@angular/core";
import { Card, CardCount } from "../../interfaces";
import { CardSet } from "../../interfaces/hs-types";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { ConfigService, cardStyles } from "../services/config.service";
import "../rxjs-operators";

@Component({
    //moduleId: module.id,
    selector: "card",
    templateUrl: "card.component.html",
})
export class CardComponent implements OnInit {
    @Input()
    cardCount: CardCount;
    @Input()
    showCount: boolean;
    basic: boolean;
    loading: boolean;
    cardImgName: string;
    card: Card;
    count: number;

    cardStyles = cardStyles;

    constructor(
        private deckService: DeckService,
        private authService: AuthService,
        private configService: ConfigService) { }

    ngOnInit() {
        this.card = this.cardCount.card;
        this.count = this.cardCount.count;
        this.basic = this.card.cardSet === CardSet.Basic;
    }

    getStatus() {
        return (this.basic || !this.authService.isAuthenticated()) ? "" : (this.count <= this.card.numberAvailable ? "available" : "notavailable");
    }

    style() {
        return this.configService.config.cardStyle;
    }

    showAvailability() {
        return this.configService.config.enableCardAvailSelector;
    }

    changeAvailability(cardAvail: number) {
        let prevCardAvail = this.card.numberAvailable;
        cardAvail = +cardAvail;
        this.card.numberAvailable = cardAvail;
        this.loading = true;
        this.deckService
            .changeCardAvailability(this.card.id, cardAvail, prevCardAvail)
            .subscribe(() => {
                this.loading = false;
            });
    }

    getCardTooltipHtml() {
        return `<div style=""></div>`;
    }
}

interface Model {
    numberAvailable: number;
}