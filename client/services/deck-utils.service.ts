import { Injectable } from "@angular/core";
import * as contracts from "../../interfaces/index";
import { CardSet } from "../../interfaces/hs-types";
import { CardHashService } from "./card-hash.service";

@Injectable()
export class DeckUtilsService {
    constructor(private cardHashService: CardHashService) { }

    getDeckTitle(deck: contracts.Deck<contracts.Card>) {
        if (deck.collected) {
            return `[${deck.className}] ${deck.name}`;
        }

        if (deck.dustNeeded < deck.cost) {
            return `[${deck.className}] ${deck.name} (${deck.cost}, remaining ${deck.dustNeeded})`;
        }

        return `[${deck.className}] ${deck.name} (${deck.cost})`;
    }

    updateDeckStats(deck: contracts.Deck<contracts.Card> | contracts.PseudoDeck<contracts.Card>) {
        let collected = true,
            dustNeeded = deck.cost,
            lastUpdatedCardId = this.cardHashService.lastUpdateCardId,
            lastUpdatedCard = this.cardHashService.getCard(lastUpdatedCardId);

        deck.cards.forEach(cardCount => {
            if (cardCount.card.id === lastUpdatedCardId) {
                cardCount.card = lastUpdatedCard; // trigger component change check
            }
            dustNeeded -= cardCount.card.cost * Math.min(cardCount.card.numberAvailable, cardCount.count);
            collected = collected && (cardCount.card.numberAvailable >= cardCount.count || cardCount.card.cardSet === CardSet.Basic);
        });

        if (this.isDeck(deck) && deck.revisions) {
            deck.revisions.forEach(rev => {
                rev.collected = rev.cards.every((cardCount) => cardCount.card.numberAvailable >= cardCount.count);
                this.updateCards(rev.cards);
                this.updateCards(rev.cardAddition);
                this.updateCards(rev.cardRemoval);
            });
        }

        deck.dustNeeded = dustNeeded;
        deck.collected = collected;
    }

    isDeck(deck: contracts.Deck<contracts.Card> | contracts.PseudoDeck<contracts.Card>): deck is contracts.Deck<contracts.Card> {
        return !!(deck as contracts.Deck<contracts.Card>).id;
    }

    updateDeckDiffStats(diff: contracts.DeckDiff<contracts.Card>) {
        this.updateDeckStats(diff.deck);
        this.updateCards(diff.cardAddition);
        this.updateCards(diff.cardRemoval);
    }

    formatDate(date: string | Date) {
        if (typeof date !== "string") {
            date = date.toISOString();
        }
        return date.slice(0, 10);
    }

    private updateCards(cardCounts: contracts.CardCount<contracts.Card>[]) {
        var latestChangedCardId = this.cardHashService.lastUpdateCardId;
        return cardCounts && cardCounts.some(cardCount => {
            if (cardCount.card.id === latestChangedCardId) {
                cardCount.card = this.cardHashService.getCard(latestChangedCardId);
                return true;
            }
            return false;
        });
    }
}