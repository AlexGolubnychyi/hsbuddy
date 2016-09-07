import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {Deck} from "../../interfaces/index";
import {DeckFilterComponent} from "./deck.filter.component";

@Component({
    //moduleId: module.id,
    selector: "deck-list",
    templateUrl: "deck.list.component.html",
})
export class DeckListComponent implements AfterViewInit {
    decks: Deck[] = [];
    loading: boolean = true;
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