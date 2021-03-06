import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ApiService, CardChanged } from '../services/api.service';
import { DeckUtilsService } from '../services/deck-utils.service';
import { CardMissing, Card, DeckQuery } from '../../../interfaces/index';
import { DeckFilterComponent } from './deck-filter.component';
import { BaseComponent } from './base.component';
import { ConfigService } from '../services/config.service';
import { CardHashService } from '../services/card-hash.service';
import { tap, switchMap } from 'rxjs/operators';

@Component({
    moduleId: module.id,
    selector: 'missing-card-list',
    templateUrl: 'card-missing-list.component.html'
})
export class CardMissingListComponent extends BaseComponent implements AfterViewInit {

    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService
    ) { super(configService, apiService); }
    loading = true;
    missingCards: CardMissing<Card>[];

    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    ngAfterViewInit() {
        this.filter.filter$
            .pipe(
                tap<[DeckQuery, boolean]>(() => this.loading = true),
                switchMap(([params, standart]) => this.apiService.getMissingCards(standart, params))
            )
            .subscribe(cards => {
                this.missingCards = cards;
                this.loading = false;
            });
    }

    protected onCardChanged(cardChanged: CardChanged) {
        const card = this.cardHashService.getCard(cardChanged.cardId),
            missingCard = this.missingCards.find(mc => mc.cardCount.card.id === cardChanged.cardId);
        missingCard.cardCount.card = card;
    }
}
