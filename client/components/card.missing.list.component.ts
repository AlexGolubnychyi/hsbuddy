import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy } from "@angular/core";
import { DeckService, CardChanged } from "../services/deck.service";
import { DeckUtilsService } from "../services/deck.utils.service";
import { CardMissing, Card } from "../../interfaces/index";
import { DeckFilterComponent } from "./deck.filter.component";
import { RootComponentBase } from "./root.component.base";
import { ConfigService } from "../services/config.service";
import { CardHashService } from "../services/card.hash.service";

@Component({
    //moduleId: module.id,
    selector: "missing-card-list",
    templateUrl: "card.missing.list.component.html"
})
export class CardMissingListComponent extends RootComponentBase implements AfterViewInit, OnInit, OnDestroy {

    constructor(
        deckService: DeckService,
        configService: ConfigService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService
    ) { super(configService, deckService); }
    loading: boolean = true;
    missingCards: CardMissing<Card>[];

    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    ngAfterViewInit() {
        this.filter.filter$
            .do(() => this.loading = true)
            .switchMap<CardMissing<Card>[]>(params => this.deckService.getMissingCards(params))
            .subscribe(cards => {
                this.missingCards = cards;
                this.loading = false;
            });
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngDestroy() {
        super.ngOnDestroy();
    }

    protected onCardChanged(cardChanged: CardChanged) {
        let card = this.cardHashService.getCard(cardChanged.cardId);

        let missingCard = this.missingCards.find(mc => mc.cardCount.card.id === cardChanged.cardId);
        missingCard.cardCount.card = card;
    }
}