import * as crypto from "crypto";
import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces/";
import * as Promise from "bluebird";
import User from "./user";
import Card, {CardDB, cardSchemaName} from "./card";
import UserCard, {UserCardDB} from "./userCard";


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
});

deckSchema.static("generateId", (cards: { [cardName: string]: number }) => {
    let deckDNA = Object.keys(cards).map(cardName => Card.generateId(cardName) + cards[cardName]).sort().join("");
    return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
});

deckSchema.static("getDecksByParams", function (userId: string, params?: contracts.DeckQuery) {
    let model = this as mongoose.Model<DeckDB>,
        userCards: UserCardDB[],
        userDeckIds: string[],
        query = void 0,
        dustNeededParam;

    return User.getUserDeckIds(userId)
        .then(ids => userDeckIds = ids)
        .then(() => UserCard.getByUserId(userId))
        .then(uc => userCards = uc)
        .then(() => {
            if (params) {
                let queryParts = [];

                if (params.userCollection === "true") {
                    queryParts.push({ "_id": { "$in": userDeckIds } });
                }

                if (+params.deckClass > 0) {
                    queryParts.push({ "class": +params.deckClass });
                }

                if (params.dustNeeded) {
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
            let result = decks.map(deck => {

                let deckResult: contracts.Deck = {
                    id: deck._id,
                    name: deck.name,
                    url: deck.url,
                    class: deck.class,
                    className: hstypes.CardClass[deck.class],
                    cost: deck.cost,
                    dustNeeded: deck.cost,
                    collected: true,
                    cards: [],
                    userCollection: userDeckIds.indexOf(deck._id) >= 0
                }, collected = true;

                deckResult.cards = deck.cards.map(({card, count}: { card: CardDB, count: number }) => {
                    let userCard = userCards.filter(uc => uc.cardId === card._id)[0],
                        cardResult: contracts.Card = {
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
                            numberAvailable: (userCard && userCard.count) || 0,
                            count: count
                        };
                    deckResult.dustNeeded -= Math.min(cardResult.count, cardResult.numberAvailable) * card.cost;
                    collected = collected && (cardResult.numberAvailable >= cardResult.count || cardResult.cardSet === hstypes.CardSet.Basic);
                    return cardResult;
                }).sort(sortFunc);

                deckResult.collected = collected;

                return deckResult;
            });
            if (typeof dustNeededParam === "number") {
                result = result.filter(d => d.dustNeeded <= dustNeededParam);
            }

            return result.sort((f, s) => f.dustNeeded - s.dustNeeded);
        });
});

function weightCard(card: contracts.Card) {

    let baseWeight = card.mana; // + (card.class === "neutral" ? 1000 : 0),

    if (card.cardSet === hstypes.CardSet.Basic) {
        return baseWeight;
    }

    switch (card.rarity) {
        case hstypes.CardRarity.legendary: return baseWeight + 400;
        case hstypes.CardRarity.epic: return baseWeight + 300;
        case hstypes.CardRarity.rare: return baseWeight + 200;
        case hstypes.CardRarity.common: return baseWeight + 100;
    }

    return baseWeight;
}

function sortFunc(card1: contracts.Card, card2: contracts.Card) {
    let diff = weightCard(card1) - weightCard(card2);
    if (diff) {
        return diff;
    }
    return card1.name > card2.name ? 1 : -1;
}


export interface DeckDB extends mongoose.Document {
    _id: string;
    name: string;
    url: string;
    class: hstypes.CardClass;
    cost: number;
    cards: { card: string | CardDB, count: number }[];
    dateAdded: Date;

};

interface DeckStatics {
    generateId: (cards: { [cardName: string]: number }) => string;
    getDecksByParams: (userId: string, params?: contracts.DeckQuery) => Promise<contracts.Deck[]>;
}

export const deckSchemaName = "Deck";
export default mongoose.model<DeckDB>(deckSchemaName, deckSchema) as mongoose.Model<DeckDB> & DeckStatics;