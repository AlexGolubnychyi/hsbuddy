import { Injectable } from '@angular/core';
import * as contracts from '../../../interfaces/index';

@Injectable()
export class CardHashService {
    private cardHash: contracts.CardHash = {};
    private _lastUpdateCardId: string;

    feedHash(hash: contracts.CardHash) {
        if (!hash) {
            return;
        }
        Object.keys(hash).forEach(cardId => {
            this.cardHash[cardId] = hash[cardId];
        });
    }

    getCard(cardId: string) {
        return this.cardHash[cardId];
    }

    getCardNames(token: string) {
        token = token && this.getCardId(token);
        return Object
            .keys(this.cardHash)
            .filter(key => key.indexOf(token) >= 0)
            .map(key => this.cardHash[key].name)
            .sort();
    }

    updateAvailability(cardId: string, numberAvailable: number) {
        const card = this.cardHash[cardId];
        card.numberAvailable = numberAvailable;
        this.cardHash[cardId] = { ...card };
        this._lastUpdateCardId = cardId;
    }

    get lastUpdateCardId() {
        return this._lastUpdateCardId;
    }

    inflateDeck(deck: contracts.Deck<string>): contracts.Deck<contracts.Card> {
        if (!deck) {
            return null;
        }

        return {
            ...deck,
            cards: this.inflateCards(deck.cards),
            revisions: deck.revisions && deck.revisions.map(rev => ({
                ...rev,
                cards: this.inflateCards(rev.cards),
                cardAddition: this.inflateCards(rev.cardAddition),
                cardRemoval: this.inflateCards(rev.cardRemoval)
            }))
        };
    }

    inflateDiff(diff: contracts.DeckDiff<string>): contracts.DeckDiff<contracts.Card> {
        return {
            ...diff,
            deck: this.inflateDeck(diff.deck),
            cardAddition: this.inflateCards(diff.cardAddition),
            cardRemoval: this.inflateCards(diff.cardRemoval),
        };
    }

    private inflateCards(cards: contracts.CardCount<string>[]) {
        return cards.map(c => ({ card: this.getCard(c.card), count: c.count }));
    }

    private getCardId(name: string) {
        return name.toLowerCase().replace(/[ |,|`|.|'|’|:|"]*/g, '');
    }
}
