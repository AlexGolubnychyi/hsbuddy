import * as crypto from "crypto";
import * as validUrl from "valid-url";
import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces/";
import * as Promise from "bluebird";
import User from "./user";
import Card, { CardDB, cardSchemaName } from "./card";
import UserCard from "./userCard";
import mapper from "./utils/mapper";
import { deckDiffer } from "./utils/differ";
import { UserDecks } from "./user";

const deckSchema = new mongoose.Schema({
    _id: String,
    importCode: String,
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
        importCode: String,
        url: String,
        number: Number,
        dateAdded: Date,
        diff: Number,
        cost: Number,
        standart: Boolean,
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
    standart: Boolean,
    userId: String
});

deckSchema.static("generateId", (cards: { [cardName: string]: number }) => {
    let deckDNA = Object.keys(cards).map(cardName => Card.generateId(cardName) + cards[cardName]).sort().join("");
    return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
});

deckSchema.static("getDecksByParams", function (userId: string, params?: contracts.DeckQuery & { standart: string })
    : Promise<contracts.DeckResult<contracts.Deck<string>[]>> {
    let model = this as mongoose.Model<DeckDB<CardDB>>,
        cardAvailability: { [cardId: string]: number },
        userDecks: UserDecks,
        query: {} = void 0,
        dustNeededParam: number,
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(usrDecks => userDecks = usrDecks)
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
                    queryParts.push({ "_id": { "$in": userDecks.favorites } });
                }

                if (params.showIgnored !== "true") {
                    queryParts.push({ "_id": { "$not": { "$in": userDecks.ignored } } });
                }

                if (+params.deckClass > 0) {
                    queryParts.push({ "class": +params.deckClass });
                }

                if (params.standart === "true") {
                    queryParts.push({ "standart": true });
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
                    return mapper.deckToContract(deck, cardAvailability, userDecks, cardHash);
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
        userDecks: UserDecks,
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(usrDecks => userDecks = usrDecks)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").populate("revisions.cardAddition.card").populate("revisions.cardRemoval.card").exec())
        .then(deck => mapper.wrapResult(mapper.deckToContract(deck, cardAvailability, userDecks, cardHash), cardHash));
});


deckSchema.static("upgradeDeck", function (oldDeck: DeckDB<string>, newDeck: DeckDB<string>): Promise<boolean> {

    let model = this as mongoose.Model<DeckDB<string | CardDB>> & DeckStatics,
        refCardHash: { [index: string]: number } = {},
        oldRevisions = oldDeck.revisions || [];

    newDeck.cards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);
    if (!newDeck.url) {
        //imported via code, preserve name
        newDeck.name = oldDeck.name;
    }
    //add new revision
    let newRevDiff = deckDiffer.diff(newDeck.cards, oldDeck.cards, refCardHash);
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
            importCode: oldDeck.importCode,
            standart: oldDeck.standart
        }
    ];

    //add old revisions
    oldRevisions.forEach(rev => {
        //let revCards = differ.reverse(oldDeck.cards, rev.cardAddition, rev.cardRemoval),
        //    diff = differ.diff(newDeck.cards, revCards, refCardHash);

        newDeck.revisions.push({
            number: rev.number,
            userId: rev.userId,
            importCode: rev.importCode,
            url: rev.url,
            cost: rev.cost,
            dateAdded: rev.dateAdded,
            diff: rev.diff, //diff.diff,
            cardAddition: rev.cardAddition, //diff.cardAddition,
            cardRemoval: rev.cardRemoval, //diff.cardRemoval
            standart: rev.standart
        });
    });

    return newDeck.save()
        .then(() => model.recycle(oldDeck.id, true, newDeck.id))
        .then(() => true);
});


deckSchema.static("getSimilarDecks", function (userId: string, deckId: string, standart: boolean): Promise<contracts.DeckResult<contracts.DeckDiff<string>[]>> {
    let model = this as mongoose.Model<DeckDB<CardDB>>,
        refDeck: contracts.Deck<string>,
        cardAvailability: { [cardId: string]: number },
        userDecks: UserDecks,
        cardHash: contracts.CardHash = {};

    return User.getUserDeckIds(userId)
        .then(usrDecks => userDecks = usrDecks)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => cardAvailability = uc)
        .then(() => model.findById(deckId).populate("cards.card").exec())
        .then(deck => {
            if (!deck) {
                Promise.reject(new Error("deck not found"));
            }
            refDeck = mapper.deckToContract(deck, cardAvailability, userDecks, cardHash);
        })
        .then(() => {
            let query = { "$and": [{ "_id": { "$ne": deckId } }, { "deleted": { "$ne": true } }, { "class": refDeck.class }] };
            if (standart) {
                query.$and.push(<any>{ "standart": true });
            }
            return model.find(query).populate("cards.card").exec();
        })
        .then(otherDecks => {
            let refCardHash: { [index: string]: number } = {},
                reducerHash: { [index: string]: boolean } = {};

            refDeck.cards.forEach(cardCount => refCardHash[cardCount.card] = cardCount.count);

            let diffs = otherDecks
                .map(otherDeck => {
                    let diff = deckDiffer.diff(refDeck.cards, otherDeck.cards.map(c => ({ card: (c.card as CardDB).id, count: c.count })), refCardHash);

                    if (diff.diff < 10) {
                        otherDeck.revisions = []; //we don't need revisions on sim decks
                        let deck = mapper.deckToContract(otherDeck, cardAvailability, userDecks, cardHash);
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

deckSchema.static("setDescription", function (userId: string, deckId: string, description: contracts.DeckChange): Promise<contracts.DeckChange> {
    let model = this as mongoose.Model<DeckDB<CardDB | string>>;

    return model.findById(deckId).exec()
        .then(deck => {
            if (!deck || !description) {
                return null;
            }

            let date = new Date(description.date),
                { name, url } = description;

            if (!date || !name) {
                return null;
            }

            deck.name = name;
            deck.dateAdded = date;
            if (!deck.url && url) {
                if (validUrl.isUri(url)) {
                    deck.url = url;
                }
                else {
                    description.url = "";
                }
            }
            else{
                description.url = deck.url;
            }
            return deck.save().then(() => description);
        });
});

deckSchema.static("recycle", function (deckId: string, forceDelete = false, replaceWithDeckId?: string): Promise<boolean> {
    let model = this as mongoose.Model<DeckDB<CardDB | string>> & DeckStatics;

    return model.findById(deckId).exec().then(deck => {
        if (!deck || !(deck.deleted || forceDelete)) {
            return false;
        }

        return User.find({ "$or": [{ decks: deck._id }, { ignoredDecks: deck._id }] }).exec()
            .then(users => {
                let promise = Promise.resolve() as Promise<any>;

                let usersFavoredTheDeck = users && users.filter(u => (u.decks as string[]).some(dId => dId === deck._id));
                let usersIgnoredTheDeck = users && users.filter(u => u.ignoredDecks.some(dId => dId === deck._id));

                return Promise.resolve()
                    .then(() => {
                        if (usersIgnoredTheDeck && usersIgnoredTheDeck.length) {
                            return Promise.all(usersIgnoredTheDeck.map(user => {
                                //clean up ignore lists
                                user.ignoredDecks = user.ignoredDecks.filter(dId => dId !== deck._id);
                                return user.save();
                            }));
                        }
                    }).then(() => {
                        if (usersFavoredTheDeck && usersFavoredTheDeck.length) {
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
                                promise = Promise.all(usersFavoredTheDeck.map(user => {
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
});

deckSchema.static("getMissingCards", function (userId: string, params?: contracts.DeckQuery & { standart: boolean })
    : Promise<contracts.DeckResult<contracts.CardMissing<string>[]>> {
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
    importCode: string;
    name: string;
    url: string;
    class: hstypes.CardClass;
    cost: number;
    cards: { card: T, count: number }[];
    dateAdded: Date;
    userId: string;
    deleted: boolean;
    standart: boolean;
    revisions: DeckRevisionDB<T>[];
};

export interface DeckRevisionDB<T extends string | CardDB> {
    importCode: string;
    userId: string;
    url?: string;
    number: number;
    cost: number;
    dateAdded: Date;
    diff: number;
    standart: boolean;
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
    getSimilarDecks: (userId: string, deckId: string, standart: boolean) => Promise<contracts.DeckResult<contracts.DeckDiff<string>[]>>;
    getMissingCards: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.DeckResult<contracts.CardMissing<string>[]>>;

    upgradeDeck: (oldDeck: DeckDB<string>, newDeck: DeckDB<string>) => Promise<boolean>;
    setDescription: (userId: string, deckId: string, description: contracts.DeckChange) => Promise<contracts.DeckChange>;
    recycle: (deckId: string, forceDelete?: boolean, replaceWithDeckId?: string) => Promise<boolean>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB<CardDB | string>>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB<CardDB | string>> & DeckStatics;
