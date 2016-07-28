import { Component, Input, EventEmitter, Output, OnInit } from "@angular/core";
import {Card} from "../../interfaces";
import {CardSet} from "../../interfaces/hs-types";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";

@Component({
    selector: "card",
    templateUrl: "client/components/card.component.html",
})
export class CardComponent implements OnInit {
    @Input()
    card: Card;
    @Output()
    onChanged = new EventEmitter<boolean>();
    enableAvailability: boolean;
    loading: boolean;

    constructor(private deckService: DeckService, private authService: AuthService) {}

    ngOnInit() {
        this.enableAvailability = this.authService.isAuthenticated() && this.card.cardSet !== CardSet.Basic;
    }

    onChangeAvailability(newValue: number) {
        this.loading = true;
        this.deckService.changeCardAvailability(this.card.id, newValue).subscribe(() => {
            this.loading = false;
        });
    }

    getStatus() {
        return !this.enableAvailability ? "" : (this.card.count <= this.card.numberAvailable ? "available" : "notavailable");
    }
}