import * as crypto from "crypto";
import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces/";
import * as Promise from "bluebird";
import User from "./user";
import Card, { CardDB, cardSchemaName } from "./card";
import UserCard from "./userCard";


const deckSchema = new mongoose.Schema({
    _id: String,
    name: String,
    url: String,
    class: { type: Number, index: true },
    cost: Number,
    dateAdded: Date,
    cards: [{
        card: { type: String, ref: cardSchemaName },
        count: Number
    }],
    revisions: [{
        userId: String,
        number: Number,
        dateAdded: Date,
        diff: Number,
        cardAddition: [{
            card: { type: String, ref: cardSchemaName },
            count: Number
        }],
        cardRemoval: [{
            card: { type: String, ref: cardSchemaName },
            count: Number
        }]
    }],
    deleted: Boolean,
    userId: String
});

deckSchema.static("generateId", (cards: { [cardName: string]: number }) => {
    let deckDNA = Object.keys(cards).map(cardName => Card.generateId(cardName) + cards[cardName]).sort().join("");
    return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
});

deckSchema.static("getDecksByParams", function (userId: string, params?: contracts.DeckQuery) {
    let model = this as mongoose.Model<DeckDB>,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[],
        query = void 0,
        dustNeededParam;

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => {
            if (params) {
                let queryParts: {}[] = [];
                //     { "deleted": { "$ne": true } }
                // ];

                if (params.userCollection === "true") {
                    queryParts.push({ "_id": { "$in": userDeckIds } });
                }

                if (+params.deckClass > 0) {
                    queryParts.push({ "class": +params.deckClass });
                }

                if (!isNaN(+params.dustNeeded)) {
                    dustNeededParam = +params.dustNeeded;
                }

                if (queryParts.length === 1) {
                    query = queryParts[0];
                }
                else if (queryParts.length > 0) {
                    query = { "$and": queryParts };
                }
            }
            return model.find(query).populate("cards.card").exec();
        })
        .then(decks => {
            let result = decks.map(deck => deckToContract(deck, cardAvailability, userDeckIds))
                .filter(deck => !deck.deleted || deck.userCollection);

            if (typeof dustNeededParam === "number") {
                result = result.filter(d => d.dustNeeded <= dustNeededParam);
            }
            if (+params.orderBy === contracts.OrderBy.date) {
                return result.sort((f, s) => s.dateAdded > f.dateAdded ? 1 : -1);
            }

            return result.sort((f, s) => f.dustNeeded - s.dustNeeded);
        });
});

deckSchema.static("getDeck", function (userId: string, deckId: string): Promise<contracts.Deck> {
    let model = this as mongoose.Model<DeckDB>,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[];

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").populate("revisions.cardAddition.card").populate("revisions.cardRemoval.card").exec())
        .then(deck => deckToContract(deck, cardAvailability, userDeckIds));
});


deckSchema.static("upgradeDeck", function (oldDeck: mongoose._mongoose.Model<DeckDB>, newDeck: mongoose._mongoose.Model<DeckDB>): Promise<boolean> {

    let model = this as mongoose.Model<DeckDB> & DeckStatics,
        revisions: {
            userId: string;
            date: Date;
            number: number,
            cards: CardCountMin[]
        }[] = [];

    //deck diffs => deck cards 
    if (oldDeck.revisions && oldDeck.revisions.length) {
        revisions = oldDeck.revisions.map(rev => {

            return {
                userId: rev.userId,
                date: rev.dateAdded,
                number: rev.number,
                cards: reverseDiff<CardCountMin>(<CardCountMin[]>oldDeck.cards, <CardCountMin[]>rev.cardAddition, <CardCountMin[]>rev.cardRemoval)
            };
        });
    }

    revisions.unshift({
        userId: oldDeck.userId,
        date: oldDeck.dateAdded,
        number: revisions.length + 1,
        cards: oldDeck.cards as CardCountMin[]
    });

    let refCardHash: { [index: string]: number } = {};
    (newDeck.cards as CardCountMin[]).forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);

    //deck cards => new deck diffs
    newDeck.revisions = revisions.map(rev => {
        let diff = calcDiff(newDeck.cards as CardCountMin[], rev.cards, refCardHash);
        return {
            userId: rev.userId,
            number: rev.number,
            dateAdded: rev.date,
            diff: diff.diff,
            cardAddition: diff.cardAddition,
            cardRemoval: diff.cardRemoval
        };
    });

    return newDeck.save()
        .then(() => model.recycle(oldDeck.id, true, newDeck.id))
        .then(() => true);


});


deckSchema.static("getSimilarDecks", function (userId: string, deckId: string): Promise<contracts.DeckDiff[]> {
    let model = this as mongoose.Model<DeckDB>,
        refDeck: contracts.Deck,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[];

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").exec())
        .then(deck => {
            if (!deck) {
                Promise.reject(new Error("deck not found"));
            }
            refDeck = deckToContract(deck, cardAvailability, userDeckIds);
        })
        .then(() => model.find({ "$and": [{ "_id": { "$ne": deckId } }, { "deleted": { "$ne": true } }, { "class": refDeck.class }] })
            .populate("cards.card").exec())
        .then(otherDecks => {
            let refCardHash: { [index: string]: number } = {};

            refDeck.cards.forEach(card => refCardHash[card.id] = card.count);

            let diffs = otherDecks
                .map(otherDeck => {
                    let diff = calcDiff(refDeck.cards, <CardCount[]>otherDeck.cards, refCardHash, cardAvailability);

                    if (diff.diff < 10) {
                        let deck = deckToContract(otherDeck, cardAvailability, userDeckIds);
                        //this cards are not visible and used only to calculate deck cost in case a card avail. changes
                        deck.cards = deck.cards.map(c => {
                            c.description = "";
                            c.flavorText = "";
                            c.url = "";
                            c.img = "";
                            return c;
                        });
                        return {
                            deck,
                            diff: diff.diff,
                            cardRemoval: <contracts.Card[]>diff.cardRemoval,
                            cardAddition: <contracts.Card[]>diff.cardAddition,
                        };
                    }
                    return null;
                })
                .filter(deckDiff => !!deckDiff)
                .sort((d1, d2) => d1.diff - d2.diff);

            return diffs;
        });
});

function calcDiff<T extends CardCountMin | contracts.Card>(
    refCards: T[],
    otherCards: (CardCountMin | CardCount)[],
    refCardHash?: { [index: string]: number },
    cardAvailability?: { [cardId: string]: number }
) {
    let minimal = !cardAvailability, //min setup or full blown setup
        getId = (obj: CardCountMin | CardCount) => minimal ? (obj as CardCountMin).card : (obj as CardCount).card.id,
        getId2 = (obj: CardCountMin | contracts.Card) => minimal ? (obj as CardCountMin).card : (obj as contracts.Card).id;

    if (!refCardHash) {
        refCardHash = {};
        refCards.forEach(card => refCardHash[getId2(card)] = card.count);
    }

    let otherCardHash: { [index: string]: number } = {},
        diff: {
            diff: number,
            cardAddition: T[],
            cardRemoval: T[]
        } = {
                diff: 0,
                cardAddition: [],
                cardRemoval: []
            };

    otherCards.forEach(c => {
        let cardId = getId(c),
            card = !minimal && (c as CardCount).card;

        otherCardHash[cardId] = c.count;
        let numDiff = c.count - (refCardHash[cardId] || 0);
        if (!numDiff) {
            return;
        }

        if (numDiff > 0) {
            diff.diff += numDiff;
            if (minimal) {
                diff.cardAddition.push({ card: cardId, count: numDiff } as T);
                return;
            }
            diff.cardAddition.push(cardToContract(card, cardAvailability[card.id], numDiff) as T);
            return;
        }

        if (minimal) {
            diff.cardRemoval.push({ card: cardId, count: -numDiff } as T);
            return;
        }

        diff.cardRemoval.push(cardToContract(card, cardAvailability[card.id], -numDiff) as T);
    });

    refCards.filter(c => !otherCardHash[getId2(c)]).forEach(c => diff.cardRemoval.push(c));
    return diff;
}

function reverseDiff<T extends CardCountMin | contracts.Card>(refCards: T[], cardAddition: T[], cardRemoval: T[]): T[] {
    let cardHash: { [index: string]: T } = {},
        minimal = !!(refCards[0] as CardCountMin).card,
        getId = (obj: CardCountMin | contracts.Card) => minimal ? (obj as CardCountMin).card : (obj as contracts.Card).id;

    refCards.map(c => Object.assign({}, c) as T).forEach(card => cardHash[getId(card)] = card);

    cardAddition.forEach(addition => {
        let id = getId(addition);
        if (cardHash[id]) {
            cardHash[id].count += addition.count;
            return;
        }
        cardHash[id] = addition;
    });

    cardRemoval.forEach(removal => {
        cardHash[getId(removal)].count -= removal.count;
    });

    return Object.keys(cardHash).map(card => cardHash[card]).filter(cardCount => cardCount.count > 0);

}


deckSchema.static("setDescription", function (userId: string, deckId: string, description: contracts.DeckChange) {
    let model = this as mongoose.Model<DeckDB>;

    return model.findById(deckId).exec()
        .then(deck => {
            if (!deck || !description) {
                return false;
            }

            let date = new Date(description.date),
                {name} = description;

            if (!date || !name) {
                return false;
            }

            deck.name = name;
            deck.dateAdded = date;
            return deck.save().then(() => true);
        });
});

deckSchema.static("recycle", function (deckId: string, forceDelete = false, replaceWithDeckId?: string) {
    let model = this as mongoose.Model<DeckDB> & DeckStatics;

    return model.findById(deckId).exec().then(deck => {
        if (!deck || !(deck.deleted || forceDelete)) {
            return false;
        }

        return User.find({ decks: deck._id }).exec().then(users => {
            let promise = Promise.resolve() as Promise<any>;

            if (users && users.length) {
                if (!replaceWithDeckId) {
                    if (deck.deleted) {
                        //already soft deleted
                        return false;
                    }
                    //soft delete
                    deck.deleted = true;
                    return deck.save().then(() => false);
                }
                else {
                    promise = Promise.all(users.map(user => {
                        //replace deckId in user collections (when upgrading deck)
                        user.decks = (user.decks as string[]).map((innerId) => innerId === deckId ? replaceWithDeckId : deckId);
                        return user.save();
                    }));
                }
            }

            return promise.then(() => model.findByIdAndRemove(deckId).exec()).then(() => true); //hard delete
        });
    });
});

deckSchema.static("getMissingCards", function (userId: string, params?: contracts.DeckQuery) {
    let model = this as mongoose.Model<DeckDB> & DeckStatics,
        resultObj: { [cardId: string]: contracts.CardMissing } = {},
        missingCardIds = [];


    return model.getDecksByParams(userId, params)
        .then(decks => decks.forEach(deck => {
            deck.cards.forEach(card => {
                if (card.count > card.numberAvailable) {
                    let cardMissing = resultObj[card.id];
                    if (!cardMissing) {
                        missingCardIds.push(card.id);
                        resultObj[card.id] = cardMissing = {
                            card: card,
                            decks: <any>[]
                        };
                    }
                    cardMissing.decks.push({
                        id: deck.id,
                        name: deck.name,
                        url: deck.url,
                        count: card.count,
                        cost: deck.cost,
                        dustNeeded: deck.dustNeeded,
                        className: deck.className
                    });
                }
            });
        }))
        .then(() => {
            return Object.keys(resultObj).map(cardId => resultObj[cardId])
                .sort((card1, card2) => {
                    let diff = card2.decks.length - card1.decks.length;
                    if (diff) {
                        return diff;
                    }
                    diff = card2.card.cost - card1.card.cost;
                    if (diff) {
                        return diff;
                    }
                    return card1.card.name > card2.card.name ? 1 : -1;
                });
        });
});

function deckToContract(deck: DeckDB, cardAvailability: { [cardId: string]: number }, userDeckIds: string[]) {
    if (!deck) {
        return null;
    }
    let contract: contracts.Deck = {
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
            cardAddition: rev.cardAddition.map((cardCount: CardCount) => cardToContract(cardCount.card, cardAvailability[cardCount.card.id], cardCount.count)),
            cardRemoval: rev.cardRemoval.map((cardCount: CardCount) => cardToContract(cardCount.card, cardAvailability[cardCount.card.id], cardCount.count)),
        }))
    }, collected = true;

    contract.cards = deck.cards.map(({card, count}: { card: CardDB, count: number }) => {
        let cardResult = cardToContract(card, cardAvailability[card._id], count);

        contract.dustNeeded -= Math.min(cardResult.count, cardResult.numberAvailable) * card.cost;
        collected = collected && (cardResult.numberAvailable >= cardResult.count || cardResult.cardSet === hstypes.CardSet.Basic);
        return cardResult;
    });

    contract.collected = collected;

    //restore rev cards
    contract.revisions.forEach(rev => {
        rev.cards = reverseDiff(contract.cards, rev.cardAddition, rev.cardRemoval);
        rev.collected = rev.cards.every(c => c.numberAvailable >= c.count);
    });

    return contract;
}

function cardToContract(card: CardDB, numberAvailable: number, deckCount = 0): contracts.Card {
    return {
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
        numberAvailable: card.cardSet === hstypes.CardSet.Basic ? 2 : (numberAvailable || 0),
        count: deckCount
    };
}

export interface DeckDB extends mongoose.Document {
    _id: string;
    name: string;
    url: string;
    class: hstypes.CardClass;
    cost: number;
    cards: { card: string | CardDB, count: number }[];
    dateAdded: Date;
    userId: string;
    deleted: boolean;
    revisions: {
        userId: string;
        number: number,
        dateAdded: Date,
        diff: number,
        cardAddition: {
            card: string | CardDB,
            count: number
        }[],
        cardRemoval: {
            card: string | CardDB,
            count: number
        }[]
    }[];
};

interface CardCount {
    card: CardDB;
    count: number;
}

interface CardCountMin {
    card: string;
    count: number;
}
interface DeckStatics {
    generateId: (cards: { [cardName: string]: number }) => string;
    getDecksByParams: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.Deck[]>;
    getDeck: (userId: string, deckId: string) => Promise<contracts.Deck>;
    getSimilarDecks: (userId: string, deckId: string) => Promise<contracts.Deck>;
    upgradeDeck: (oldDeck: DeckDB, newDeck: DeckDB) => Promise<boolean>;
    setDescription: (userId: string, deckId: string, description: contracts.DeckChange) => Promise<boolean>;
    getMissingCards: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.CardMissing[]>;
    softDelete: (userId: string, deckId: string) => Promise<boolean>;
    recycle: (deckId: string, forceDelete?: boolean, replaceWithDeckId?: string) => Promise<boolean>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB> & DeckStatics;