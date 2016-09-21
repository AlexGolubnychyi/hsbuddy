import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import UserCard from "./userCard";
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

cardSchema.static("getCardLibraryInfo", function (userId: string): Promise<contracts.CardLibraryInfo> {
    let model = this as mongoose.Model<CardDB>,
        userCards: { [cardId: string]: number },
        result: contracts.CardLibraryInfo = {
            groups: <any>[],
            stats: {}
        };

    return UserCard.getByUserId(userId)
        .then(uc => userCards = uc)
        .then(() => model.find({ "cardSet": { "$in": hstypes.standardCardSets } }).exec())
        .then(cards => {
            cards.map(card => {
                let userCard = userCards[card._id],
                    cardResult: contracts.CardCount = {
                        card: {
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
                            numberAvailable: card.cardSet === hstypes.CardSet.Basic ? 2 : (userCard || 0),
                        },
                        count: card.rarity === hstypes.CardRarity.legendary ? 1 : 2
                    };
                //stats
                let type = result.stats[hstypes.CardType[card.type]] = result.stats[hstypes.CardType[card.type]] || [0, 0],
                    rarity = result.stats[hstypes.CardRarity[card.rarity]] = result.stats[hstypes.CardRarity[card.rarity]] || [0, 0],
                    cardClass = result.stats[hstypes.CardClass[card.class]] = result.stats[hstypes.CardClass[card.class]] || [0, 0];

                [type, rarity, cardClass].forEach(stat => {
                    stat[0] += (cardResult.card.numberAvailable > 0 || cardResult.card.cardSet === hstypes.CardSet.Basic) ? 1 : 0;
                    stat[1]++;
                });

                return cardResult;
            }).forEach(cardCount => {
                let group = result.groups.filter(g => g.class === cardCount.card.class)[0];
                if (!group) {
                    group = {
                        class: cardCount.card.class,
                        name: hstypes.CardClass[cardCount.card.class],
                        cards: [],
                    };
                    result.groups.push(group);
                }
                group.cards.push(cardCount);
            });

            //sort
            result.groups.forEach(g => g.cards = g.cards.sort(sortCards));
            result.groups = result.groups.sort((f, s) => {
                return weightClass(f.class) - weightClass(s.class);
            });

            return result;
        });
});

function weightClass(c: hstypes.CardClass) {
    return c === hstypes.CardClass.neutral ? 1000 : c;
}
function sortCards(f: contracts.CardCount, s: contracts.CardCount) {
    let result = f.card.mana - s.card.mana;
    if (result) {
        return result;
    }
    return f.card.name > s.card.name ? 1 : -1;
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
    getCardLibraryInfo: (userId: string) => Promise<contracts.CardLibraryInfo>;
}

export const cardSchemaName = "Card";
export default mongoose.model<CardDB>(cardSchemaName, cardSchema) as mongoose.Model<CardDB> & CardStatics;