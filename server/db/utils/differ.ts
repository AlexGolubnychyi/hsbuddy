import { CardCount, Diff } from "../../../interfaces/";

type CardCountMin = CardCount<string>;

class Differ {

    diff(
        refCards: CardCountMin[],
        otherCards: CardCountMin[],
        refCardHash?: { [index: string]: number }
    ) {

        if (!refCardHash) {
            refCardHash = {};
            refCards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);
        }

        let otherCardHash: { [index: string]: number } = {},
            diff: Diff<string> = {
                diff: 0,
                cardAddition: [],
                cardRemoval: []
            };

        otherCards.forEach(cardCount => {
            otherCardHash[cardCount.card] = cardCount.count;
            let numDiff = cardCount.count - (refCardHash[cardCount.card] || 0);
            if (!numDiff) {
                return;
            }

            if (numDiff > 0) {
                diff.diff += numDiff;
                diff.cardAddition.push({ card: cardCount.card, count: numDiff });
                return;
            }

            diff.cardRemoval.push({ card: cardCount.card, count: -numDiff });
        });

        refCards.filter(c => !otherCardHash[c.card]).forEach(c => diff.cardRemoval.push(c));
        return diff;
    }

    reverse<T extends CardCountMin>(refCards: T[], cardAddition: T[], cardRemoval: T[]) {
        let cardHash: { [index: string]: number } = {};
        if (cardAddition == null && cardRemoval == null) {
            return refCards;
        }
        refCards.forEach(cardCount => cardHash[cardCount.card] = cardCount.count);
        cardAddition.forEach(addition => cardHash[addition.card] = (cardHash[addition.card] || 0) + addition.count);
        cardRemoval.forEach(removal => {
            cardHash[removal.card] -= removal.count;
        });

        return Object.keys(cardHash)
            .map(card => (<CardCountMin>{ card, count: cardHash[card] }))
            .filter(cardCount => cardCount.count > 0);
    }
}

export const deckDiffer = new Differ();
