import * as hstypes from "../../../interfaces/hs-types";
import * as contracts from "../../../interfaces/";
import { CardDB } from "../card";
import { DeckDB } from "../deck";
import differ from "./differ";


class Mapper {
    deckToContract(deck: DeckDB<CardDB>, cardAvail: { [cardId: string]: number }, userDeckIds: string[], cardHash: contracts.CardHash) {
        if (!deck) {
            return null;
        }
        let contract: contracts.Deck<string> = {
            id: deck._id,
            name: deck.name,
            url: deck.url,
            dateAdded: deck.dateAdded,
            class: deck.class,
            className: hstypes.CardClass[deck.class],
            cost: deck.cost,
            dustNeeded: deck.cost,
            collected: true,
            cards: [],
            userCollection: userDeckIds.indexOf(deck._id) >= 0,
            userId: deck.userId,
            deleted: deck.deleted,
            revisions: deck.revisions.map(rev => ({
                collected: false,
                cards: [],
                userId: rev.userId,
                number: rev.number,
                dateAdded: rev.dateAdded,
                diff: rev.diff,
                cardAddition: rev.cardAddition.map(cardCount => this.cardToContract(cardCount, cardAvail[cardCount.card.id], cardHash).cardCount),
                cardRemoval: rev.cardRemoval.map(cardCount => this.cardToContract(cardCount, cardAvail[cardCount.card.id], cardHash).cardCount),
            }))
        }, collected = true;

        contract.cards = deck.cards.map(cardCountDB => {
            let {cardCount, cardContract} = this.cardToContract(cardCountDB, cardAvail[cardCountDB.card._id], cardHash);

            contract.dustNeeded -= Math.min(cardCount.count, cardContract.numberAvailable) * cardContract.cost;
            collected = collected && cardContract.numberAvailable >= cardCount.count;
            return cardCount;
        });

        contract.collected = collected;

        //restore rev cards, depend on contract cards
        contract.revisions.forEach(rev => {
            rev.cards = differ.reverse(contract.cards, rev.cardAddition, rev.cardRemoval);
            rev.collected = rev.cards.every(c => cardHash[c.card].numberAvailable >= c.count);
        });

        return contract;
    }

    cardToContract(cardCount: DBCardCount, numberAvailable: number, cardHash: contracts.CardHash) {
        numberAvailable = cardCount.card.cardSet === hstypes.CardSet.Basic ? 2 : (numberAvailable || 0);
        let card = cardCount.card;

        let cardContract = cardHash[card.id] = cardHash[card.id] || {
            id: card._id,
            name: card.name,
            description: card.description,
            flavorText: card.flavorText,
            img: card.img,
            class: card.class,
            className: hstypes.CardClass[card.class],
            type: card.type,
            rarity: card.rarity,
            cardSet: card.cardSet,
            setName: <string>hstypes.hsTypeConverter.cardSet(card.cardSet),
            race: card.race,
            url: card.url,
            cost: card.cost,
            mana: card.mana,
            attack: card.attack,
            health: card.health,
            numberAvailable: numberAvailable
        };

        return {
            cardCount: { card: card.id, count: cardCount.count },
            cardContract
        };
    }


    wrapResult<T>(result: T, cardHash: contracts.CardHash) {
        return <contracts.DeckResult<T>>{ result, cardHash };
    }

}

export default new Mapper();

export interface DBCardCount {
    card: CardDB;
    count: number;
}

