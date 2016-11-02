import { Injectable } from "@angular/core";
import * as contracts from "../../interfaces/index";

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
        let card = this.cardHash[cardId];
        card.numberAvailable = numberAvailable;
        this.cardHash[cardId] = Object.assign({}, card);
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
            id: deck.id,
            name: deck.name,
            url: deck.url,
            cards: this.inflateCards(deck.cards),
            class: deck.class,
            className: deck.className,
            collected: deck.collected,
            cost: deck.cost,
            dateAdded: deck.dateAdded,
            deleted: deck.deleted,
            dustNeeded: deck.dustNeeded,
            revisions: deck.revisions && deck.revisions.map(rev => ({
                number: rev.number,
                userId: rev.userId,
                url: rev.url,
                dateAdded: rev.dateAdded,
                cards: this.inflateCards(rev.cards),
                collected: rev.collected,
                diff: rev.diff,
                cardAddition: this.inflateCards(rev.cardAddition),
                cardRemoval: this.inflateCards(rev.cardRemoval),
            })),
            userCollection: deck.userCollection,
            userId: deck.userId
        };
    }

    inflateDiff(diff: contracts.DeckDiff<string>): contracts.DeckDiff<contracts.Card> {
        return {
            deck: this.inflateDeck(diff.deck),
            diff: diff.diff,
            cardAddition: this.inflateCards(diff.cardAddition),
            cardRemoval: this.inflateCards(diff.cardRemoval),
        };
    }

    private inflateCards(cards: contracts.CardCount<string>[]) {
        return cards.map(c => ({ card: this.getCard(c.card), count: c.count }));
    }

    private getCardId(name: string) {
        return name.toLowerCase().replace(/[ |,|`|.|'|’|:|"]*/g, "");
    }
}