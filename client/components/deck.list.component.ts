import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {DeckComponent} from "./deck.component";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {Deck} from "../../interfaces/index";
import {SpinnerComponent} from "./spinner.component";
import {DeckFilterComponent} from "./deck.filter.component";

@Component({
    selector: "deck-list",
    templateUrl: "client/components/deck.list.component.html",
    directives: [DeckComponent, SpinnerComponent, DeckFilterComponent]
})
export class DeckListComponent implements AfterViewInit {
    decks: Deck[] = [];
    loading: boolean;
    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    constructor(private deckService: DeckService, private authService: AuthService) { }
    ngAfterViewInit() {
         this.filter.filter$
            .do(() => this.loading = true)
            .switchMap<Deck[]>(params => this.deckService.getDecks(params))
            .subscribe(decks => {
                this.decks = decks;
                this.loading = false;
            });
    }
}