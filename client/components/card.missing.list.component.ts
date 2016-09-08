import { Component, ViewChild, AfterViewInit } from "@angular/core";
import { DeckService } from "../services/deck.service";
import { DeckUtilsService } from "../services/deck.utils.service";
import { CardMissing } from "../../interfaces/index";
import { DeckFilterComponent } from "./deck.filter.component";

@Component({
    //moduleId: module.id,
    selector: "missing-card-list",
    templateUrl: "card.missing.list.component.html"
})
export class CardMissingListComponent implements AfterViewInit {
    constructor(
        private deckService: DeckService,
        private utils: DeckUtilsService
    ) { }
    loading: boolean = true;
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