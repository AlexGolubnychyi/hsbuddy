import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";

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
}
export const cardSchemaName = "Card";
export default mongoose.model<CardDB>(cardSchemaName, cardSchema) as mongoose.Model<CardDB> & CardStatics;