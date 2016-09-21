import { Injectable } from "@angular/core";
import * as contracts from "../../interfaces/index";
import { CardSet } from "../../interfaces/hs-types";
import {CardChanged} from "./deck.service";

@Injectable()
export class DeckUtilsService {

    getDeckTitle(deck: contracts.DeckInflated) {
        if (deck.collected) {
            return `[${deck.className}] ${deck.name}`;
        }

        if (deck.dustNeeded < deck.cost) {
            return `[${deck.className}] ${deck.name} (${deck.cost}, remaining ${deck.dustNeeded})`;
        }

        return `[${deck.className}] ${deck.name} (${deck.cost})`;
    }

    updateDeckStats(deck: contracts.DeckInflated, cardChanged: CardChanged) {
        let collected = true,
            containsChangedCard = false;
        deck.cards.forEach(({card, count}) => {
            if (card.id === cardChanged.cardId) {
                deck.dustNeeded -= card.cost * (Math.min(cardChanged.cardAvail, count) - Math.min(cardChanged.prevCardAvail, count));
                containsChangedCard = true;
            }
            collected = collected && (card.numberAvailable >= count || card.cardSet === CardSet.Basic);
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