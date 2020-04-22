
import * as Promise from 'bluebird';
import { CardClass } from '../../../interfaces/hs-types';
import { cardDB } from '../card';
import { CardCount } from '../../../interfaces/index';


const deckStringVersion = 1;
const startMarker = 0;
const endMarker = 0;
const standardDeckFlag = 2;
const wildDeckFlag = 1;
const сardClassIdMapping: { [index: number]: CardClass } = {
    274: CardClass.druid,
    31: CardClass.hunter,
    2826: CardClass.hunter,
    637: CardClass.mage,
    2829: CardClass.mage,
    39117: CardClass.mage,
    671: CardClass.paladin,
    2827: CardClass.paladin,
    813: CardClass.priest,
    41887: CardClass.priest,
    930: CardClass.rogue,
    40195: CardClass.rogue,
    1066: CardClass.shaman,
    40183: CardClass.shaman,
    7: CardClass.warrior,
    2828: CardClass.warrior,
    893: CardClass.warlock,
    47817: CardClass.warlock,
    46116: CardClass.paladin,
    53237: CardClass.shaman,
    51834: CardClass.warlock,
    56550: CardClass.demonhunter,
};
class DeckEncoder {
    encode(deckClass: CardClass, isStandard: boolean, cards: { count: number, card: { dbfId: number } }[]) {
        const byteArray: number[] = [];
        byteArray.push(startMarker);
        byteArray.push(deckStringVersion);
        byteArray.push(isStandard ? standardDeckFlag : wildDeckFlag);

        // hero
        byteArray.push(1); // always 1 hero
        let heroCode = 0;
        Object.keys(сardClassIdMapping).some(key => {
            if (сardClassIdMapping[key] === deckClass) {
                heroCode = +key;
                return true;
            }
        });
        if (!heroCode) {
            throw new DeckEncoderError('card class is not found');
        }
        this.writeHSValue(byteArray, heroCode);



        // cards
        const singles = cards.filter(c => c.count === 1);
        byteArray.push(singles.length);
        singles.forEach(c => this.writeHSValue(byteArray, c.card.dbfId));

        const doubles = cards.filter(c => c.count === 2);
        byteArray.push(doubles.length);
        doubles.forEach(c => this.writeHSValue(byteArray, c.card.dbfId));


        byteArray.push(endMarker);

        const result = Buffer.from(byteArray).toString('base64');
        return result;
    }

    decode(deckCode: string): Promise<CardCount<string>[]> {
        let cardCodeCounts: { dbfId: number, count: number }[];
        try {
            cardCodeCounts = this.decodeInternal(deckCode);
        } catch (e) {
            return Promise.reject(e);
        }

        const hash: { [index: string]: number; } =
            cardCodeCounts.reduce((acc, current) => (acc[current.dbfId] = current.count, acc), {});

        return Promise
            .all(cardCodeCounts.map(c => cardDB.findOne({ dbfId: c.dbfId }).then(cardDb => ({ dbfId: c.dbfId, card: cardDb }))))
            .then(entries => entries.map(entry => {
                if (!entry.card) {
                    throw new DeckEncoderError(`DbfId = ${entry.dbfId} not found`);
                }
                return { card: entry.card.id, count: hash[entry.dbfId] };
            }));
    }

    private decodeInternal(deckCode: string) {
        const data: HsStringUrlData = {
            buffer: new Buffer(deckCode, 'base64'),
            offset: 0
        };

        const start = this.readUIntValue(data);
        if (start !== startMarker) {
            throw new DeckEncoderError(`unsupported deck url format: start = ${start}`);
        }

        const version = this.readUIntValue(data);
        if (version !== deckStringVersion) {
            throw new DeckEncoderError(`unsupported deck url version: ${version}`);
        }

        const format = this.readUIntValue(data);
        const isStandart = format === standardDeckFlag;
        if (!isStandart && format !== wildDeckFlag) {
            throw new DeckEncoderError(`unsupported deck format: ${format}`);
        }

        const cards = [];
        const heroNumber = this.readHSValue(data);
        if (heroNumber !== 1) {
            throw new DeckEncoderError(`unsupported number of heroes: ${heroNumber}`);
        }
        const heroCode = this.readHSValue(data);
        const hero = сardClassIdMapping[heroCode];
        if (!hero) {
            throw new DeckEncoderError(`unsupported heroe: ${heroCode}`);
        }

        const singles = this.readUIntValue(data);
        for (let i = 0; i < singles; i++) {
            const value = this.readHSValue(data);
            cards.push({ dbfId: value, count: 1 });
        }

        const doubles = this.readUIntValue(data);
        for (let i = 0; i < doubles; i++) {
            const value = this.readHSValue(data);
            cards.push({ dbfId: value, count: 2 });
        }

        const end = this.readUIntValue(data);
        if (end !== endMarker) {
            throw new DeckEncoderError(`unsupported deck url format: end = ${end}`);
        }

        return cards;
    }


    private readUIntValue(data: HsStringUrlData) {
        return data.buffer[data.offset++];
    }
    private readHSValue(data: HsStringUrlData) {
        let result = 0, shift = 0;
        while (true) {
            const val = data.buffer[data.offset++];

            // tslint:disable-next-line:no-bitwise
            result |= ((val & 0b01111111) << shift); // remove highest bit, push in front and join with prev value

            // tslint:disable-next-line:no-bitwise
            if (!(val & 0b10000000)) { // highest bit indicates that there is more
                break;
            }

            shift += 7;
        }

        return result;
    }

    private writeHSValue(byteArray: number[], value: number) {
        while (true) {
            // tslint:disable-next-line:no-bitwise
            const byte = value & 0b01111111; // cut highest bit off
            // tslint:disable-next-line:no-bitwise
            value >>= 7;
            if (!value) {
                byteArray.push(byte);
                return;
            }

            // tslint:disable-next-line:no-bitwise
            byteArray.push(byte | 0b10000000); // set highest bit as an indicator that there is more
        }
    }
}



export const deckEncoder = new DeckEncoder();

export class DeckEncoderError extends Error { }


interface HsStringUrlData {
    buffer: Buffer;
    offset: number;
}
