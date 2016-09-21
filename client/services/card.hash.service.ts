import { Injectable } from "@angular/core";
import * as contracts from "../../interfaces/index";

@Injectable()
export class CardHashService {
    private cardHash: contracts.CardHash = {};

    feedHash(hash: contracts.CardHash) {
        Object.keys(hash).forEach(cardId => {
            this.cardHash[cardId] = this.cardHash[cardId] || hash[cardId];
        });
    }

    getCard(cardId: string) {
        return this.cardHash[cardId];
    }


    inflateDeck(deck: contracts.Deck): contracts.DeckInflated {
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
                dateAdded: rev.dateAdded,
                userId: rev.userId,
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

    inflateDiff(diff: contracts.DeckDiff): contracts.DeckDiffInflated {
        return {
            deck: this.inflateDeck(diff.deck),
            diff: diff.diff,
            cardAddition: this.inflateCards(diff.cardAddition),
            cardRemoval: this.inflateCards(diff.cardRemoval),
        };
    }

    private inflateCards(cards: contracts.CardCountMin[]) {
        return cards.map(c => ({ card: this.getCard(c.card), count: c.count }));
    }
}