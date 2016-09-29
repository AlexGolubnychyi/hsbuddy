import { Component, Input, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { Card } from "../../interfaces";
import { CardSet } from "../../interfaces/hs-types";
import { ApiService } from "../services/api.service";
import { AuthService } from "../services/auth.service";
import { cardStyles, Config } from "../services/config.service";
import "../rxjs-operators";

@Component({
    //moduleId: module.id,
    selector: "card",
    templateUrl: "card.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit {
    @Input()
    card: Card;
    @Input()
    count: number;
    @Input()
    showCount: boolean;
    @Input()
    config: Config;
    basic: boolean;
    loading: boolean;
    cardImgName: string;

    cardStyles = cardStyles;

    constructor(
        private deckService: ApiService,
        private authService: AuthService) { }

    ngOnInit() {
        this.basic = this.card.cardSet === CardSet.Basic;
    }

    getStatus() {
        return (this.basic || !this.authService.isAuthenticated()) ? "" : (this.count <= this.card.numberAvailable ? "available" : "notavailable");
    }

    getAvailStatus() {
        if (this.basic || !this.authService.isAuthenticated() || this.count <= this.card.numberAvailable) {
            return "";
        }

        return this.card.numberAvailable > 0 ? "semiavailable" : "notavailable";
    }

    changeAvailability(cardAvail: number) {
        let prevCardAvail = this.card.numberAvailable;
        cardAvail = +cardAvail;
        this.loading = true;
        this.deckService
            .changeCardAvailability(this.card.id, cardAvail, prevCardAvail)
            .subscribe(() => {
                this.loading = false;
            });
    }

}

interface Model {
    numberAvailable: number;
}