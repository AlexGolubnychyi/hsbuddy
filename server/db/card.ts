import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import UserCard, {UserCardDB} from "./userCard";
import * as contracts from "../../interfaces/";

const cardSchema = new mongoose.Schema({
    _id: String,
    name: String,
    description: String,
    flavorText: String,
    img: String,
    class: Number,
    type: Number,
    rarity: Number,
    cardSet: Number,
    race: Number,
    url: String,
    cost: Number,
    mana: Number,
    attack: Number,
    health: Number
});

cardSchema.static("generateId", (name: string) => {
    return name.toLowerCase().replace(/[ |,|`|.|'|:|"]*/g, "");
});

cardSchema.static("getAllCards", function (userId: string) {
    let model = this as mongoose.Model<CardDB>,
        userCards: { [cardId: string]: number },
        standardSets = [
            hstypes.CardSet.Basic, hstypes.CardSet.BlackrockMountain,
            hstypes.CardSet.Expert, hstypes.CardSet.LeagueOfExplorers,
            hstypes.CardSet.TheGrandTournament, hstypes.CardSet.WhispersoftheOldGods
        ],
        result: contracts.CardGroup[] = [];

    return UserCard.getByUserId(userId)
        .then(uc => userCards = uc)
        .then(() => model.find({ "cardSet": { "$in": standardSets } }).exec())
        .then(cards => {
            cards.map(card => {
                let userCard = userCards[card._id],
                    cardResult: contracts.Card = {
                        id: card._id,
                        name: card.name,
                        description: card.description,
                        flavorText: card.flavorText,
                        img: card.img,
                        class: card.class,
                        className: "", // hstypes.CardClass[card.class],
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
                        numberAvailable: userCard || 0,
                        count: card.rarity === hstypes.CardRarity.legendary ? 1 : 2
                    };
                return cardResult;
            }).forEach(card => {
                let group = result.filter(g => g.class === card.class)[0];
                if (!group) {
                    group = {
                        class: card.class,
                        name: hstypes.CardClass[card.class],
                        cards: [],
                    };
                    result.push(group);
                }
                group.cards.push(card);
            });

            //sort
            result.forEach(g => g.cards = g.cards.sort(sortCars));
            result = result.sort((f, s) => {
                return weightClass(f.class) - weightClass(s.class);
            });

            return result;
        });
});

function weightClass(c: hstypes.CardClass) {
    return c === hstypes.CardClass.neutral ? 1000 : c;
}
function sortCars(f: contracts.Card, s: contracts.Card) {
    let result = f.mana - s.mana;
    if (result) {
        return result;
    }
    return f.name > s.name ? 1 : -1;
}

export interface CardDB extends mongoose.Document {
    _id: string;
    name: string;
    description: string;
    flavorText: string;
    img: string;
    class: hstypes.CardClass;
    type: hstypes.CardType;
    rarity: hstypes.CardRarity;
    cardSet: hstypes.CardSet;
    race: hstypes.CardRace;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
};

interface CardStatics {
    generateId: (name: string) => string;
    getAllCards: (userId: string) => Promise<contracts.CardGroup[]>;
}

export const cardSchemaName = "Card";
export default mongoose.model<CardDB>(cardSchemaName, cardSchema) as mongoose.Model<CardDB> & CardStatics;