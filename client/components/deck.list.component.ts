import { Component, OnInit  } from "@angular/core";
import {CardComponent} from "./card.component";
import {DeckService} from "../services/deck.service";
import {Deck} from "../../interfaces";
import "../rxjs-operators";
//https://angular.io/docs/ts/latest/tutorial/toh-pt6.html
//https://angular.io/docs/ts/latest/cookbook/component-communication.html#!#child-to-parent
@Component({
    selector: "deck-list",
    templateUrl: "client/components/deck.list.component.html",
    directives: [CardComponent],
    providers: [DeckService]
})
export class DeckListComponent implements OnInit {
    decks: Deck[] = [];
    constructor(private deckService: DeckService) { }
    ngOnInit() {
        this.refreshDecks();
    }

    onCardChanged() {
        this.refreshDecks();
    }

    private refreshDecks() {
        this.deckService.getDecks().subscribe(decks => {
            this.decks = decks;
        });
    }
}