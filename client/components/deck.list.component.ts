import { Component} from "@angular/core";
import {DeckComponent} from "./deck.component";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {Deck, DeckQuery} from "../../interfaces/index";
import {SpinnerComponent} from "./spinner.component";
import {DeckFilterComponent} from "./deck.filter.component";


@Component({
    selector: "deck-list",
    templateUrl: "client/components/deck.list.component.html",
    directives: [DeckComponent, SpinnerComponent, DeckFilterComponent]
})
export class DeckListComponent  {
    decks: Deck[] = [];
    loading: boolean;

    constructor(private deckService: DeckService, private authService: AuthService) { }

    refreshDecks(params: DeckQuery) {
        this.loading = true;
        this.deckService
            .getDecks(params)
            .subscribe(decks => {
                this.decks = decks;
                this.loading = false;
            });
    }
}