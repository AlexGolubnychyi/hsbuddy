import { Component, Input, OnInit } from "@angular/core";
import { Card } from "../../interfaces";
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
    card: Card;
    @Input()
    showCount: boolean;
    basic: boolean;
    loading: boolean;
    cardImgName: string;

    cardStyles = cardStyles;

    constructor(
        private deckService: DeckService,
        private authService: AuthService,
        private configService: ConfigService) { }

    ngOnInit() {
        this.basic = this.card.cardSet === CardSet.Basic;
    }

    getStatus() {
        return (this.basic || !this.authService.isAuthenticated()) ? "" : (this.card.count <= this.card.numberAvailable ? "available" : "notavailable");
    }

    style() {
        return this.configService.config.cardStyle;
    }

    showAvailability() {
        return this.configService.config.enableCardAvailSelector;
    }

    changeAvailability(number: number) {
        this.loading = true;
        this.deckService
            .changeCardAvailability(this.card.id, +number)
            .subscribe(() => {
                 this.card.numberAvailable = +number;
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