import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {CardMissing} from "../../interfaces/index";
import {CardComponent} from "./card.component";
import {SpinnerComponent} from "./spinner.component";
import {DeckFilterComponent} from "./deck.filter.component";

@Component({
    selector: "missing-card-list",
    templateUrl: "client/components/card.missing.list.component.html",
    directives: [CardComponent, SpinnerComponent, DeckFilterComponent]
})
export class CardMissingListComponent implements AfterViewInit {
    constructor(private deckService: DeckService) { }
    loading: boolean;
    missingCards: CardMissing[];
    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    ngAfterViewInit() {
        this.filter.filter$
            .do(() => this.loading = true)
            .switchMap<CardMissing[]>(params => this.deckService.getMissingCards(params))
            .subscribe(cards => {
                this.missingCards = cards;
                this.loading = false;
            });
    }
}