import { Component, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ApiService, CardChanged } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { Deck, Card, DeckQuery } from '../../../interfaces/index';
import { DeckFilterComponent } from './deck-filter.component';
import { BaseComponent } from './base.component';
import { Subscription } from 'rxjs/Subscription';
@Component({
    moduleId: module.id,
    selector: 'deck-list',
    templateUrl: 'deck-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class DeckListComponent extends BaseComponent implements AfterViewInit, OnDestroy {
    decks: Deck<Card>[] = [];
    loading = true;

    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    filterSubscription: Subscription;

    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private authService: AuthService,
        private ref: ChangeDetectorRef
    ) { super(configService, apiService); }

    ngAfterViewInit() {
        this.filterSubscription = this.filter.filter$
            .do<[DeckQuery, boolean]>(() => this.loading = true)
            .switchMap(([params, standart]) => this.apiService.getDecks(standart, params))
            .subscribe(decks => {
                this.ref.markForCheck();
                this.decks = decks;
                this.loading = false;

            });
    }

    ngOnDestroy() {
        if (this.filterSubscription) {
            this.filterSubscription.unsubscribe();
        }
    }

    deckIdentity(index: number, deck: Deck<Card>) {
        return deck.id;
    }

    onDeleteDeck(deckId: string) {
        this.decks = this.decks.filter(d => d.id !== deckId);
    }

    onCardChanged(cardChanged: CardChanged) {
        this.ref.markForCheck();
        this.decks = this.decks.map(deck => {
            if (deck.cards.some(c => c.card.id === cardChanged.cardId)) {
                return { ...deck }; // trigger changed deck redraw
            }
            return deck;
        });
    }

    onConfigChanged(standartChanged: boolean) {
        // trigger deck redraw
        this.ref.markForCheck();
        this.decks = this.decks.map(deck => {
            return  { ...deck };
        });
    }
}
