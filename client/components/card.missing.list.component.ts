import { Component } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {CardMissing} from "../../interfaces/index";
import {CardComponent} from "./card.component";
import {SpinnerComponent} from "./spinner.component";
import {DeckQuery} from "../../interfaces/index";
import {DeckFilterComponent} from "./deck.filter.component";

@Component({
    selector: "missing-card-list",
    templateUrl: "client/components/card.missing.list.component.html",
    directives: [CardComponent, SpinnerComponent, DeckFilterComponent]
})
export class CardMissingListComponent {
    constructor(private deckService: DeckService) { }
    loading: boolean;
    missingCards: CardMissing[];

    refreshCards(params: DeckQuery) {
        this.loading = true;
        this.deckService
            .getMissingCards(params)
            .subscribe(missing => {
                this.missingCards = missing;
                this.loading = false;
            });
    }
}
