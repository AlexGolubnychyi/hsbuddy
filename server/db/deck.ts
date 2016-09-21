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

deckSchema.static("getDecksByParams", function (userId: string, params?: contracts.DeckQuery): Promise<contracts.DeckResult<contracts.Deck[]>> {
    let model = this as mongoose.Model<DeckDB>,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[],
        query = void 0,
        dustNeededParam,
        cardHash: contracts.CardHash = {};

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
            let result = decks
                .map(deck => {
                    deck.revisions = []; //reduce unneeded processing
                    return deckToContract(deck, cardAvailability, userDeckIds, cardHash);
                })
                .filter(deck => !deck.deleted || deck.userCollection);

            //dust
            if (typeof dustNeededParam === "number") {
                result = result.filter(d => d.dustNeeded <= dustNeededParam);
            }

            //sort
            if (+params.orderBy === contracts.OrderBy.date) {
                result = result.sort((f, s) => s.dateAdded > f.dateAdded ? 1 : -1);
            }
            else {
                result = result.sort((f, s) => f.dustNeeded - s.dustNeeded);
            }

            return wrapResult(result, cardHash);
        });
});

deckSchema.static("getDeck", function (userId: string, deckId: string): Promise<contracts.DeckResult<contracts.Deck>> {
    let model = this as mongoose.Model<DeckDB>,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[],
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").populate("revisions.cardAddition.card").populate("revisions.cardRemoval.card").exec())
        .then(deck => wrapResult(deckToContract(deck, cardAvailability, userDeckIds, cardHash), cardHash));
});


deckSchema.static("upgradeDeck", function (oldDeck: mongoose._mongoose.Model<DeckDB>, newDeck: mongoose._mongoose.Model<DeckDB>): Promise<boolean> {

    let model = this as mongoose.Model<DeckDB> & DeckStatics,
        revisions: {
            userId: string;
            date: Date;
            number: number,
            cards: contracts.CardCountMin[]
        }[] = [];

    //deck diffs => deck cards 
    if (oldDeck.revisions && oldDeck.revisions.length) {
        revisions = oldDeck.revisions.map(rev => {

            return {
                userId: rev.userId,
                date: rev.dateAdded,
                number: rev.number,
                cards: reverseDiff(
                    <contracts.CardCountMin[]>oldDeck.cards,
                    <contracts.CardCountMin[]>rev.cardAddition,
                    <contracts.CardCountMin[]>rev.cardRemoval
                )
            };
        });
    }

    revisions.unshift({
        userId: oldDeck.userId,
        date: oldDeck.dateAdded,
        number: revisions.length + 1,
        cards: oldDeck.cards as contracts.CardCountMin[]
    });

    let refCardHash: { [index: string]: number } = {};
    (newDeck.cards as contracts.CardCountMin[]).forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);

    //deck cards => new deck diffs
    newDeck.revisions = revisions.map(rev => {
        let diff = calcDiff(newDeck.cards as contracts.CardCountMin[], rev.cards, refCardHash);
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


deckSchema.static("getSimilarDecks", function (userId: string, deckId: string): Promise<contracts.DeckResult<contracts.DeckDiff[]>> {
    let model = this as mongoose.Model<DeckDB>,
        refDeck: contracts.Deck,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[],
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").exec())
        .then(deck => {
            if (!deck) {
                Promise.reject(new Error("deck not found"));
            }
            refDeck = deckToContract(deck, cardAvailability, userDeckIds, cardHash);
        })
        .then(() => model.find({ "$and": [{ "_id": { "$ne": deckId } }, { "deleted": { "$ne": true } }, { "class": refDeck.class }] })
            .populate("cards.card").exec())
        .then(otherDecks => {
            let refCardHash: { [index: string]: number } = {},
                reducerHash: { [index: string]: boolean } = {};

            refDeck.cards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);

            let diffs = otherDecks
                .map(otherDeck => {
                    let diff = calcDiff(refDeck.cards, otherDeck.cards.map(c => ({ card: (c.card as CardDB).id, count: c.count })), refCardHash);

                    if (diff.diff < 10) {
                        let deck = deckToContract(otherDeck, cardAvailability, userDeckIds, cardHash);
                        diff.cardAddition.forEach(cardCount => reducerHash[cardCount.card] = true);
                        return {
                            deck,
                            diff: diff.diff,
                            cardRemoval: diff.cardRemoval,
                            cardAddition: diff.cardAddition,
                        };
                    }
                    return null;
                })
                .filter(deckDiff => !!deckDiff)
                .sort((d1, d2) => d1.diff - d2.diff);

            //reduce response size, send only additions 
            cardHash = Object.keys(cardHash).filter(id => reducerHash[id]).reduce((hash, cardId) => {
                hash[cardId] = cardHash[cardId];
                return hash;
            }, {});

            return wrapResult(diffs, cardHash);
        });
});

function calcDiff(
    refCards: contracts.CardCountMin[],
    otherCards: contracts.CardCountMin[],
    refCardHash?: { [index: string]: number }
) {

    if (!refCardHash) {
        refCardHash = {};
        refCards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);
    }

    let otherCardHash: { [index: string]: number } = {},
        diff: {
            diff: number,
            cardAddition: contracts.CardCountMin[],
            cardRemoval: contracts.CardCountMin[]
        } = {
                diff: 0,
                cardAddition: [],
                cardRemoval: []
            };

    otherCards.forEach(cardCount => {
        //let card = !minimal && (c as CardCount).card;
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

function reverseDiff(refCards: contracts.CardCountMin[], cardAddition: contracts.CardCountMin[], cardRemoval: contracts.CardCountMin[]) {
    let cardHash: { [index: string]: number } = {};

    refCards.forEach(cardCount => cardHash[cardCount.card] = cardCount.count);
    cardAddition.forEach(addition => cardHash[addition.card] = (cardHash[addition.card] || 0) + addition.count);
    cardRemoval.forEach(removal => {
        cardHash[removal.card] -= removal.count;
    });

    return Object.keys(cardHash).map(card => (<contracts.CardCountMin>{ card, count: cardHash[card] })).filter(cardCount => cardCount.count > 0);
}


deckSchema.static("setDescription", function (userId: string, deckId: string, description: contracts.DeckChange): Promise<boolean> {
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

deckSchema.static("recycle", function (deckId: string, forceDelete = false, replaceWithDeckId?: string): Promise<boolean> {
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
                        user.decks = (user.decks as string[]).map((innerId) => innerId === deckId ? replaceWithDeckId : innerId);
                        return user.save();
                    }));
                }
            }

            return promise.then(() => model.findByIdAndRemove(deckId).exec()).then(() => true); //hard delete
        });
    });
});

deckSchema.static("getMissingCards", function (userId: string, params?: contracts.DeckQuery): Promise<contracts.CardMissing[]> {
    let model = this as mongoose.Model<DeckDB> & DeckStatics,
        resultObj: { [cardId: string]: contracts.CardMissing } = {};


    return model.getDecksByParams(userId, params)
        .then(decks => decks.result.forEach(deck => {
            deck.cards.forEach(cardCount => {
                let card = decks.cardHash[cardCount.card];
                if (cardCount.count > card.numberAvailable) {
                    let cardMissing = resultObj[card.id];
                    if (!cardMissing) {
                        resultObj[card.id] = cardMissing = {
                            cardCount: {
                                card,
                                count: cardCount.count
                            },
                            decks: <any>[]
                        };
                    }
                    cardMissing.decks.push({
                        id: deck.id,
                        name: deck.name,
                        url: deck.url,
                        count: cardCount.count,
                        cost: deck.cost,
                        dustNeeded: deck.dustNeeded,
                        className: deck.className
                    });
                }
            });
        }))
        .then(() => {
            return Object.keys(resultObj)
                .map(cardId => resultObj[cardId])
                .map(card => {
                    card.decks = card.decks.sort((d1, d2) => d1.dustNeeded - d2.dustNeeded);
                    return card;
                })
                .sort((card1, card2) => {
                    let diff = card2.decks.length - card1.decks.length;
                    if (diff) {
                        return diff;
                    }
                    diff = card2.cardCount.card.cost - card1.cardCount.card.cost;
                    if (diff) {
                        return diff;
                    }
                    return card1.cardCount.card.name > card2.cardCount.card.name ? 1 : -1;
                });
        });
});

function deckToContract(deck: DeckDB, cardAvailability: { [cardId: string]: number }, userDeckIds: string[], cardHash: contracts.CardHash) {
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
            cardAddition: rev.cardAddition.map((cardCount: CardCount) => cardToContract(cardCount, cardAvailability[cardCount.card.id], cardHash)[0]),
            cardRemoval: rev.cardRemoval.map((cardCount: CardCount) => cardToContract(cardCount, cardAvailability[cardCount.card.id], cardHash)[0]),
        }))
    }, collected = true;

    contract.cards = deck.cards.map((cardCount: CardCount) => {
        let [cardResult, cardContract] = cardToContract(cardCount, cardAvailability[cardCount.card._id], cardHash);

        contract.dustNeeded -= Math.min(cardCount.count, cardContract.numberAvailable) * cardContract.cost;
        collected = collected && cardContract.numberAvailable >= cardCount.count;
        return cardResult;
    });

    contract.collected = collected;

    //restore rev cards, depend on contract cards
    contract.revisions.forEach(rev => {
        rev.cards = reverseDiff(contract.cards, rev.cardAddition, rev.cardRemoval);
        rev.collected = rev.cards.every(c => cardHash[c.card].numberAvailable >= c.count);
    });

    return contract;
}

function cardToContract(cardCount: CardCount, numberAvailable: number, cardHash: contracts.CardHash): [contracts.CardCountMin, contracts.Card] {
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

    return [{ card: card.id, count: cardCount.count }, cardContract];
}

function wrapResult<T>(result: T, cardHash: contracts.CardHash) {
    return <contracts.DeckResult<T>>{ result, cardHash };
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



interface DeckStatics {
    generateId: (cards: { [cardName: string]: number }) => string;
    getDecksByParams: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.DeckResult<contracts.Deck[]>>;
    getDeck: (userId: string, deckId: string) => Promise<contracts.DeckResult<contracts.Deck>>;
    getSimilarDecks: (userId: string, deckId: string) => Promise<contracts.DeckResult<contracts.DeckDiff[]>>;
    upgradeDeck: (oldDeck: DeckDB, newDeck: DeckDB) => Promise<boolean>;
    setDescription: (userId: string, deckId: string, description: contracts.DeckChange) => Promise<boolean>;
    getMissingCards: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.CardMissing[]>;
    recycle: (deckId: string, forceDelete?: boolean, replaceWithDeckId?: string) => Promise<boolean>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB> & DeckStatics;