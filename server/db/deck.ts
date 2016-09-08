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
        number: Number,
        dateAdded: Date,
        cardAdditions: [{
            card: { type: String, ref: cardSchemaName },
            count: Number
        }],
        cardRemovals: [{
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
        userCards: { [cardId: string]: number },
        userDeckIds: string[],
        query = void 0,
        dustNeededParam;

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => userCards = uc)
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
            let result = decks.map(deck => deckToContract(deck, userCards, userDeckIds))
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

deckSchema.static("getDeckDetail", function (userId: string, deckId: string) {
    let model = this as mongoose.Model<DeckDB>,
        userCards: { [cardId: string]: number },
        userDeckIds: string[];

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => userCards = uc)
        .then(() => model.findById(deckId).populate("cards.card").exec())
        .then(deck => {
            let deckResult = deckToContract(deck, userCards, userDeckIds);

            return <contracts.DeckDetail>{
                deck: deckResult,
                deprecatedBy: null,
                upgradeUpon: null,
                similar: []
            };
        });
});


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

deckSchema.static("recycle", function (deckId: string, forceDelete = false) {
    let model = this as mongoose.Model<DeckDB> & DeckStatics;

    return model.findById(deckId).exec().then(deck => {
        if (!deck || !(deck.deleted || forceDelete)) {
            return false;
        }

        return User.find({ decks: deck._id }).exec().then(users => {
            if (users && users.length) {
                if (deck.deleted) {
                    return false;
                }
                //soft delete
                deck.deleted = true;
                return deck.save().then(() => false);
            }
            //hard delete
            return model.findByIdAndRemove(deckId).exec().then(() => true);
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

function deckToContract(deck: DeckDB, userCards: { [cardId: string]: number }, userDeckIds: string[]) {
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
        deleted: deck.deleted
    }, collected = true;

    contract.cards = deck.cards.map(({card, count}: { card: CardDB, count: number }) => {
        let cardResult = cardToContract(card, userCards[card._id], count);

        contract.dustNeeded -= Math.min(cardResult.count, cardResult.numberAvailable) * card.cost;
        collected = collected && (cardResult.numberAvailable >= cardResult.count || cardResult.cardSet === hstypes.CardSet.Basic);
        return cardResult;
    });

    contract.collected = collected;

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
};

interface DeckStatics {
    generateId: (cards: { [cardName: string]: number }) => string;
    getDecksByParams: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.Deck[]>;
    getDeckDetail: (userId: string, deckId: string) => Promise<contracts.DeckDetail>;
    setDescription: (userId: string, deckId: string, description: contracts.DeckChange) => Promise<boolean>;
    getMissingCards: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.CardMissing[]>;
    softDelete: (userId: string, deckId: string) => Promise<boolean>;
    recycle: (deckId: string, forceDelete?: boolean) => Promise<boolean>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB> & DeckStatics;