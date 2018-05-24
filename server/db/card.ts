import * as Promise from 'bluebird';
import * as contracts from '../../interfaces/';
import * as hstypes from '../../interfaces/hs-types';
import mongoose from '../lib/mongoose';
import UserCard from './userCard';
import mapper from './utils/mapper';

const cardSchema = new mongoose.Schema({
    _id: String,
    dbfId: Number,
    officialId: String,
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
    health: Number,
    keywords: { type: String, index: true }
});

cardSchema.static('generateId', (name: string) => {
    return name.trim().toLowerCase().replace(/[ |,|`|.|'|’|:|"]*/g, '');
});

cardSchema.static('getCardLibraryInfo', function (userId: string, standart: boolean): Promise<contracts.DeckResult<contracts.CardLibraryInfo<string>>> {

    const model = this as mongoose.Model<CardDB>,
        cardHash: contracts.CardHash = {},
        result: contracts.CardLibraryInfo<string> = {
            groups: <any>[],
            stats: {}
        };
    let userCards: { [cardId: string]: number };

    return UserCard.getByUserId(userId)
        .then(uc => userCards = uc)
        .then(() => model.find({ 'cardSet': { '$in': standart ? hstypes.standardCardSets : hstypes.wildCardSets } }).exec())
        .then(cards => {
            cards.map(card => {
                const numberAvailable = userCards[card._id],
                    count = card.rarity === hstypes.CardRarity.legendary ? 1 : 2,
                    cardInfo = mapper.cardToContract({ card, count }, numberAvailable, cardHash),
                    maxAvailNumber = Math.min(cardInfo.cardContract.numberAvailable, count);

                // stats
                const type = result.stats[hstypes.CardType[card.type]] = result.stats[hstypes.CardType[card.type]] || [0, 0],
                    rarity = result.stats[hstypes.CardRarity[card.rarity]] = result.stats[hstypes.CardRarity[card.rarity]] || [0, 0],
                    cardClass = result.stats[hstypes.CardClass[card.class]] = result.stats[hstypes.CardClass[card.class]] || [0, 0],
                    cardSet = result.stats[hstypes.CardSet[card.cardSet]] = result.stats[hstypes.CardSet[card.cardSet]] || [0, 0],
                    dust = result.stats[hstypes.dust] = result.stats[hstypes.dust] || [0, 0],
                    cardSetDust = result.stats[hstypes.CardSet[card.cardSet] + hstypes.dust] = result.stats[hstypes.CardSet[card.cardSet] + hstypes.dust] || [0, 0],
                    cardClassDust = result.stats[hstypes.CardClass[card.class] + hstypes.dust] = result.stats[hstypes.CardClass[card.class] + hstypes.dust] || [0, 0];

                [type, rarity, cardClass, cardSet].forEach(stat => {
                    stat[0] += maxAvailNumber;
                    stat[1] += count;
                });

                [dust, cardClassDust, cardSetDust].forEach(stat => {
                    stat[0] += maxAvailNumber * card.cost || maxAvailNumber;
                    stat[1] += count * card.cost || count;
                });

                return cardInfo;
            }).forEach(cardInfo => {
                let group = result.groups.filter(g => g.class === cardInfo.cardContract.class)[0];
                if (!group) {
                    group = {
                        class: cardInfo.cardContract.class,
                        name: hstypes.CardClass[cardInfo.cardContract.class],
                        cards: [],
                    };
                    result.groups.push(group);
                }
                group.cards.push(cardInfo.cardCount);
            });

            // sort
            // result.groups.forEach(g => g.cards = g.cards.sort(sortCards));
            result.groups = result.groups.sort((f, s) => {
                return weightClass(f.class) - weightClass(s.class);
            });

            return mapper.wrapResult(result, cardHash);
        });
});

function weightClass(c: hstypes.CardClass) {
    return c === hstypes.CardClass.neutral ? 1000 : c;
}

// function sortCards(f: contracts.CardCount, s: contracts.CardCount) {
//     let result = f.card.mana - s.card.mana;
//     if (result) {
//         return result;
//     }
//     return f.card.name > s.card.name ? 1 : -1;
// }

export interface CardDB extends mongoose.Document {
    _id: string;
    dbfId: number;
    officialId: string;
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
    keywords: string;
}

interface CardStatics {
    generateId: (name: string) => string;
    getCardLibraryInfo: (userId: string, standart: boolean) => Promise<contracts.DeckResult<contracts.CardLibraryInfo<string>>>;
}

export const cardSchemaName = 'Card';
export const cardDB = mongoose.model<CardDB>(cardSchemaName, cardSchema) as mongoose.Model<CardDB> & CardStatics;
