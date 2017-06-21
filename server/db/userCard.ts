import mongoose from "../lib/mongoose";
import * as hstypes from "../../interfaces/hs-types";
import { CardCount } from "../../interfaces";
import * as Promise from "bluebird";
import { cardDB, CardDB, cardSchemaName } from "./card";
import { userSchemaName } from "./user";

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

    return cardDB.findById(cardId).exec()
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

userCardSchema.static("import", function (userId: string, cardCounts: CardCount<string>[]) {
    let model = (this as mongoose.Model<UserCardDB>),
        cardHash: { [index: string]: CardDB } = {};

    return cardDB.find().exec()
        .then(cards => {
            cardHash = cards.reduce((acc, card) => { acc[card.id] = card; return acc; }, {} as { [index: string]: CardDB });
            let cardsNotFound = cardCounts.filter(cc => !cardHash[cc.card]);
            if (cardsNotFound.length) {
                return Promise.reject(`collection malformed. Some cards do not exist: ${cardsNotFound.map(cc => cc.card).join(", ")}`);
            }
        })
        .then(() => model.remove({ "userId": userId })) //remove all old entries 
        .then(() => {
            let userCards = cardCounts.map(cc => {
                let userCard = new model(),
                    card = cardHash[cc.card];

                userCard.userId = userId;
                userCard.cardId = cc.card;
                userCard.count = Math.min(cc.count, card.rarity === hstypes.CardRarity.legendary ? 1 : 2); //remove duplicates
                return userCard;
            });

            return model.insertMany(userCards);
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
    import: (userId: string, cardCounts: CardCount<string>[]) => Promise<void>;
}

export default mongoose.model<UserCardDB>("UserCard", userCardSchema) as mongoose.Model<UserCardDB> & UserCardStatics;


