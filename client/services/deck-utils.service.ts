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

    updateDeckStats<T extends contracts.Deck<contracts.Card> | contracts.PseudoDeck<contracts.Card>>(deck: T)  {
        let collected = true,
            dustNeeded = deck.cost,
            lastUpdatedCardId = this.cardHashService.lastUpdateCardId,
            lastUpdatedCard = this.cardHashService.getCard(lastUpdatedCardId),
            changed = false;

        //deck
        deck.cards.forEach(cardCount => {
            if (cardCount.card.id === lastUpdatedCardId) {
                changed = true;
                cardCount.card = lastUpdatedCard; // trigger component change check
            }
            dustNeeded -= cardCount.card.cost * Math.min(cardCount.card.numberAvailable, cardCount.count);
            collected = collected && (cardCount.card.numberAvailable >= cardCount.count || cardCount.card.cardSet === CardSet.Basic);
        });
        deck.dustNeeded = dustNeeded;
        deck.collected = collected;

        //deck revisions 
        if (this.isDeck(deck) && deck.revisions) {
            deck.revisions = deck.revisions.map(rev => {
                let revChanged = false,
                    revCollected = true;
                rev.cards.forEach(cardCount => {
                    if (cardCount.card.id === lastUpdatedCardId) {
                        cardCount.card = lastUpdatedCard;
                        revChanged = true;
                    }
                    revCollected = revCollected && cardCount.card.numberAvailable >= cardCount.count;
                });
                rev.collected = revCollected;

                this.updateCards(rev.cardAddition);
                this.updateCards(rev.cardRemoval);
                if (revChanged) {
                    return this.updateRef(rev);
                }
                return rev;
            });
        }

        return changed ? this.updateRef(deck) : deck;
    }

    isDeck(deck: contracts.Deck<contracts.Card> | contracts.PseudoDeck<contracts.Card>): deck is contracts.Deck<contracts.Card> {
        return !!(deck as contracts.Deck<contracts.Card>).id;
    }

    updateDeckDiffStats(diff: contracts.DeckDiff<contracts.Card>) {
        this.updateCards(diff.cardAddition);
        this.updateCards(diff.cardRemoval);
        diff.deck = this.updateDeckStats(diff.deck);
    }

    updateRef<T>(obj: T) {
        return Object.assign({}, obj);
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