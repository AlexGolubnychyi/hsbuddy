import * as crypto from "crypto";
import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces/";
import * as Promise from "bluebird";
import User from "./user";
import Card, { CardDB, cardSchemaName } from "./card";
import UserCard from "./userCard";
import differ from "./utils/differ";
import mapper from "./utils/mapper";

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
        url: String,
        number: Number,
        dateAdded: Date,
        diff: Number,
        cost: Number,
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

deckSchema.static("getDecksByParams", function (userId: string, params?: contracts.DeckQuery): Promise<contracts.DeckResult<contracts.Deck<string>[]>> {
    let model = this as mongoose.Model<DeckDB<CardDB>>,
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

                if (params.deckName) {
                    queryParts.push({ "name": new RegExp(`.*${params.deckName}.*`, "i") });
                }

                if (params.cardName) {
                    queryParts.push({ "cards.card": new RegExp(`.*${Card.generateId(params.cardName)}.*`, "i") });
                }

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
                    return mapper.deckToContract(deck, cardAvailability, userDeckIds, cardHash);
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
                result = result.sort((f, s) => f.dustNeeded - s.dustNeeded || +s.collected - (+f.collected));
            }

            return mapper.wrapResult(result, cardHash);
        });
});

deckSchema.static("getDeck", function (userId: string, deckId: string): Promise<contracts.DeckResult<contracts.Deck<string>>> {
    let model = this as mongoose.Model<DeckDB<CardDB>>,
        cardAvailability: { [cardId: string]: number },
        userDeckIds: string[],
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").populate("revisions.cardAddition.card").populate("revisions.cardRemoval.card").exec())
        .then(deck => mapper.wrapResult(mapper.deckToContract(deck, cardAvailability, userDeckIds, cardHash), cardHash));
});


deckSchema.static("upgradeDeck", function (oldDeck: DeckDB<string>, newDeck: DeckDB<string>): Promise<boolean> {

    let model = this as mongoose.Model<DeckDB<string | CardDB>> & DeckStatics,
        refCardHash: { [index: string]: number } = {},
        oldRevisions = oldDeck.revisions || [];

    newDeck.cards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);
    //add new revision
    let newRevDiff = differ.diff(newDeck.cards, oldDeck.cards, refCardHash);
    newDeck.revisions = [
        {
            userId: oldDeck.userId,
            url: oldDeck.url,
            number: oldRevisions.length + 1,
            dateAdded: oldDeck.dateAdded,
            cost: oldDeck.cost,
            diff: newRevDiff.diff,
            cardAddition: newRevDiff.cardAddition,
            cardRemoval: newRevDiff.cardRemoval,
        }
    ];

    //add old revisions
    oldRevisions.forEach(rev => {
        //let revCards = differ.reverse(oldDeck.cards, rev.cardAddition, rev.cardRemoval),
        //    diff = differ.diff(newDeck.cards, revCards, refCardHash);

        newDeck.revisions.push({
            number: rev.number,
            userId: rev.userId,
            url: rev.url,
            cost: rev.cost,
            dateAdded: rev.dateAdded,
            diff: rev.diff, //diff.diff,
            cardAddition: rev.cardAddition, //diff.cardAddition,
            cardRemoval: rev.cardRemoval//diff.cardRemoval
        });
    });

    return newDeck.save()
        .then(() => model.recycle(oldDeck.id, true, newDeck.id))
        .then(() => true);
});


deckSchema.static("getSimilarDecks", function (userId: string, deckId: string): Promise<contracts.DeckResult<contracts.DeckDiff<string>[]>> {
    let model = this as mongoose.Model<DeckDB<CardDB>>,
        refDeck: contracts.Deck<string>,
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
            refDeck = mapper.deckToContract(deck, cardAvailability, userDeckIds, cardHash);
        })
        .then(() => model.find({ "$and": [{ "_id": { "$ne": deckId } }, { "deleted": { "$ne": true } }, { "class": refDeck.class }] })
            .populate("cards.card").exec())
        .then(otherDecks => {
            let refCardHash: { [index: string]: number } = {},
                reducerHash: { [index: string]: boolean } = {};

            refDeck.cards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);

            let diffs = otherDecks
                .map(otherDeck => {
                    let diff = differ.diff(refDeck.cards, otherDeck.cards.map(c => ({ card: (c.card as CardDB).id, count: c.count })), refCardHash);

                    if (diff.diff < 10) {
                        otherDeck.revisions = []; //we don't need revisions on sim decks
                        let deck = mapper.deckToContract(otherDeck, cardAvailability, userDeckIds, cardHash);
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

            return mapper.wrapResult(diffs, cardHash);
        });
});

deckSchema.static("setDescription", function (userId: string, deckId: string, description: contracts.DeckChange): Promise<boolean> {
    let model = this as mongoose.Model<DeckDB<CardDB | string>>;

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
    let model = this as mongoose.Model<DeckDB<CardDB | string>> & DeckStatics;

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

deckSchema.static("getMissingCards", function (userId: string, params?: contracts.DeckQuery): Promise<contracts.DeckResult<contracts.CardMissing<string>[]>> {
    let model = this as mongoose.Model<DeckDB<CardDB | string>> & DeckStatics,
        resultObj: { [cardId: string]: contracts.CardMissing<string> } = {},
        cardHash: contracts.CardHash;

    return model.getDecksByParams(userId, params)
        .then(decks => decks.result.forEach(deck => {
            cardHash = decks.cardHash;
            deck.cards.forEach(cardCount => {
                let card = cardHash[cardCount.card];
                if (cardCount.count > card.numberAvailable) {
                    let cardMissing = resultObj[card.id];
                    if (!cardMissing) {
                        resultObj[card.id] = cardMissing = {
                            cardCount,
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
            let result = Object.keys(resultObj)
                .map(cardId => resultObj[cardId])
                .map(card => {
                    card.decks = card.decks.sort((d1, d2) => d1.dustNeeded - d2.dustNeeded);
                    return card;
                })
                .sort((cardMissing1, cardMissing2) => {
                    let diff = cardMissing2.decks.length - cardMissing1.decks.length;
                    if (diff) {
                        return diff;
                    }

                    let card1 = cardHash[cardMissing1.cardCount.card],
                        card2 = cardHash[cardMissing2.cardCount.card];

                    diff = card2.cost - card1.cost;
                    if (diff) {
                        return diff;
                    }

                    return card1.name > card2.name ? 1 : -1;
                });

            return mapper.wrapResult(result, cardHash);
        });
});


export interface DeckDB<T extends string | CardDB> extends mongoose.Document {
    _id: string;
    name: string;
    url: string;
    class: hstypes.CardClass;
    cost: number;
    cards: { card: T, count: number }[];
    dateAdded: Date;
    userId: string;
    deleted: boolean;
    revisions: DeckRevisionDB<T>[];
};

export interface DeckRevisionDB<T extends string | CardDB> {
    userId: string;
    url?: string;
    number: number;
    cost: number;
    dateAdded: Date;
    diff: number;
    cardAddition: {
        card: T;
        count: number;
    }[];
    cardRemoval: {
        card: T;
        count: number;
    }[];
}

interface DeckStatics {
    generateId: (cards: { [cardName: string]: number }) => string;
    getDecksByParams: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.DeckResult<contracts.Deck<string>[]>>;
    getDeck: (userId: string, deckId: string) => Promise<contracts.DeckResult<contracts.Deck<string>>>;
    getSimilarDecks: (userId: string, deckId: string) => Promise<contracts.DeckResult<contracts.DeckDiff<string>[]>>;
    getMissingCards: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.DeckResult<contracts.CardMissing<string>[]>>;

    upgradeDeck: (oldDeck: DeckDB<string>, newDeck: DeckDB<string>) => Promise<boolean>;
    setDescription: (userId: string, deckId: string, description: contracts.DeckChange) => Promise<boolean>;
    recycle: (deckId: string, forceDelete?: boolean, replaceWithDeckId?: string) => Promise<boolean>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB<CardDB | string>>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB<CardDB | string>> & DeckStatics;