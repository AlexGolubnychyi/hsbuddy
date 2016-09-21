import { Component, ViewChild, AfterViewInit } from "@angular/core";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { DeckInflated } from "../../interfaces/index";
import { DeckFilterComponent } from "./deck.filter.component";

@Component({
    //moduleId: module.id,
    selector: "deck-list",
    templateUrl: "deck.list.component.html",
})
export class DeckListComponent implements AfterViewInit {
    decks: DeckInflated[] = [];
    loading: boolean = true;
    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    constructor(private deckService: DeckService, private authService: AuthService) { }
    ngAfterViewInit() {
        this.filter.filter$
            .do(() => this.loading = true)
            .switchMap<DeckInflated[]>(params => this.deckService.getDecks(params))
            .subscribe(decks => {
                this.decks = decks;
                this.loading = false;
            });
    }

    onDeleteDeck(deckId: string) {
        this.decks = this.decks.filter(d => d.id !== deckId);
    }
}