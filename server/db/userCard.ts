import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import * as Promise from "bluebird";
import cardModel, {CardDB, cardSchemaName} from "./card";
import {userSchemaName} from "./user";

const userCardSchema = new mongoose.Schema({
    userId: { type: String, index: true, ref: userSchemaName },
    cardId: { type: String, index: true, ref: cardSchemaName },
    count: Number
});

userCardSchema.static("getByUserId", function (userId: string) {
    let info: { [cardId: string]: number } = {};
    return (this as mongoose.Model<UserCardDB>)
        .find({ userId }).exec()
        .then(userCards => {
            userCards.forEach(uc => info[uc.cardId] = uc.count);
            return info;
        });
});

userCardSchema.static("setWithChecks", function (userId: string, cardId: string, count: number) {
    let model = (this as mongoose.Model<UserCardDB>),
        card: CardDB;

    return cardModel.findById(cardId).exec()
        .then(c => card = c)
        .then(() => model.findOne({ "$and": [{ userId }, { cardId }] }).exec())
        .then(userCard => {
            count = Math.min(count, card.rarity === hstypes.CardRarity.legendary ? 1 : 2);

            if (userCard && userCard.count === count) {
                return;
            }
            userCard = userCard || new model();
            userCard.userId = userId;
            userCard.cardId = cardId;
            userCard.count = count;
            return userCard.save();
        });
});


export interface UserCardDB extends mongoose.Document {
    userId: string;
    cardId: string;
    count: number;
};

interface UserCardStatics {
    getByUserId: (userId: string) => Promise<{ [cardId: string]: number }>;
    setWithChecks: (userId: string, cardId: string, count: number) => Promise<void>;
}

export default mongoose.model<UserCardDB>("UserCard", userCardSchema) as mongoose.Model<UserCardDB> & UserCardStatics;


