import { Component, OnInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {CardMissing} from "../../interfaces/index";
import {CardComponent} from "./card.component";
import {SpinnerComponent} from "./spinner.component";

@Component({
    selector: "missing-card-list",
    templateUrl: "client/components/card.missing.list.component.html",
    directives: [CardComponent, SpinnerComponent]
})
export class CardMissingListComponent implements OnInit {
    constructor(private deckService: DeckService) { }
    loading: boolean;
    missingCards: CardMissing[];

    ngOnInit() {
        this.refreshCards();
    }

    private refreshCards() {
        this.loading = true;
        this.deckService
            .getMissingCards()
            .subscribe(missing => {
                this.missingCards = missing;
                this.loading = false;
            });
    }
}
