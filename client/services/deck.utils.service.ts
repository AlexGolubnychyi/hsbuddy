import { Injectable } from "@angular/core";
import * as contracts from "../../interfaces/index";
import { CardSet } from "../../interfaces/hs-types";

@Injectable()
export class DeckUtilsService {

    getDeckTitle(deck: contracts.Deck) {
        if (deck.collected) {
            return `[${deck.className}] ${deck.name}`;
        }

        if (deck.dustNeeded < deck.cost) {
            return `[${deck.className}] ${deck.name} (${deck.cost}, remaining ${deck.dustNeeded})`;
        }

        return `[${deck.className}] ${deck.name} (${deck.cost})`;
    }

    updateDeckStats(deck: contracts.Deck, cardId: string, newCount: number) {
        let collected = true,
            containsChangedCard = false;
        deck.cards.forEach(card => {
            if (card.id === cardId) {
                deck.dustNeeded -= card.cost * (Math.min(newCount, card.count) - Math.min(card.numberAvailable, card.count));
                card.numberAvailable = newCount;
                containsChangedCard = true;
            }
            collected = collected && (card.numberAvailable >= card.count || card.cardSet === CardSet.Basic);
        });

        if (containsChangedCard) {
            deck.collected = collected;
            return true;
        }
        return false;
    }

    formatDate(date: string | Date) {
        if (typeof date !== "string") {
            date = date.toISOString();
        }
        return date.slice(0, 10);
    }
}