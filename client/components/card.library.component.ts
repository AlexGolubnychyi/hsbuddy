import { Component, OnInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {CardGroup} from "../../interfaces/index";
import {CardComponent} from "./card.component";
import {SpinnerComponent} from "./spinner.component";

@Component({
    selector: "card-list",
    templateUrl: "client/components/card.library.component.html",
    directives: [CardComponent, SpinnerComponent]
})
export class CardListComponent implements OnInit {
    constructor(private deckService: DeckService) { }
    loading: boolean;
    cardGroups: CardGroup[];

    ngOnInit() {
        this.refreshCards();
    }

    private refreshCards() {
        this.loading = true;
        this.deckService
            .getCards()
            .subscribe(groups => {
                this.cardGroups = groups;
                this.cardGroups.forEach((group, inx) => group.collapsed = inx > 0);
                this.loading = false;
            });
    }
}
