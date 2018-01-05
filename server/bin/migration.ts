import mongoose from '../lib/mongoose';
import { cardDB, CardDB } from '../db/card';
import Deck, { DeckDB, DeckRevisionDB } from '../db/deck';
import * as hstypes from '../../interfaces/hs-types';
import * as contracts from '../../interfaces';
import versionDb from '../db/version';
import parser from '../parsers';
import * as Promise from 'bluebird';
import { getJSON } from '../lib/request';
import { deckEncoder } from '../db/utils/deckEncoder';
import { deckDiffer } from '../db/utils/differ';
import { HSJSONCard } from '../parsers/cardParse';


const updates: (() => Promise<void>)[] = [
    updateToVersion1,
    updateToVersion2,
    updateToVersion3,
    updateToVersion4,
    updateToVersion5,
    updateToVersion6,
    updateToVersion7,
    updateToVersion8,
    updateToVersion9,
    updateToVersion10,
    updateToVersion11,
    updateToVersion12,
    updateToVersion13,
    updateToVersion14,
    updateToVersion15,
    updateToVersion16,
    updateToVersion17,
    updateToVersion18,
    updateToVersion19,
    updateToVersion20,
    updateToVersion21,
    updateToVersion22,
    updateToVersion23
];

(function checkForUpdates() {
    console.log('check db for updates');
    versionDb.getVersion().then(versionNumber => {
        console.log(`current db version number is ${versionNumber}`);
        const missingUpdates = updates.slice(versionNumber);
        if (!missingUpdates.length) {
            console.log('db is up to date');
            process.exit();
        }
        return Promise
            .each(missingUpdates, update => update())
            .then(() => console.log('all updates installed successfully'))
            .then(() => versionDb.setVersion(updates.length))
            .then(() => console.log('db ver: ' + updates.length))
            .then(() => process.exit());

    });
})();

// -------------------------updates-------------------------------------
function updateToVersion1(): Promise<void> {
    const version = 1;

    console.log(`apply ver${version}`);
    return cardDB.findOne().exec()
        .then(card => {
            if (card === null) {
                console.log('db is empty => population');
                return parser.populateWithCards();
            } else {
                console.log('db already contains cards');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion2(): Promise<void> {
    const version = 2;

    console.log(`apply ver${version}`);
    return Deck.find().exec()
        .then(decks => {
            console.log('add Deck.dateAdded');
            decks.forEach(d => d.dateAdded = d.dateAdded || new Date());
            return decks;
        }).map((deck: DeckDB<string>) => deck.save())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion3(): Promise<void> {
    const version = 3;

    console.log(`apply ver${version}`);
    return cardDB.find({ 'cardSet': 0 }).exec()
        .then(cards => {
            console.log('fix Naxx cards');
            cards.forEach(c => c.cardSet = hstypes.CardSet.Naxxramas);
            return cards;
        }).map((card: CardDB) => card.save())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion4(): Promise<void> {
    const version = 4;

    console.log(`apply ver${version}`);
    return Deck.find({ name: 'Pirate Warrior (Standard) deck list and guide - Hearthstone - July 2016' }).exec()
        .then(badDecks => {
            console.log('remove faulty pirate warrior deck');
            return badDecks;
        })
        .then(badDecks => Promise.map(badDecks, bd => bd.remove()))
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion5(): Promise<void> {
    const version = 5;

    console.log(`apply ver${version}`);
    console.log('fix cards from basic set to be free not common');
    return cardDB.find({ cardSet: 1 }).exec()
        .then(badDecks => Promise.map(badDecks, bc => {
            bc.rarity = hstypes.CardRarity.free;
            return bc.save();
        }))
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion6(): Promise<void> {
    const version = 6;
    let urls: string[];

    console.log(`apply ver${version}`);
    console.log('fix deck dates');
    return Deck.find().exec()
        .then(decks => {
            urls = decks.map(deck => deck.url);
            return Promise.map(decks, deck => deck.remove());
        })
        .then(() => parser.parse(void 0, urls))
        .then(reports => {
            const failed = reports.filter(r => r.status !== contracts.ParseStatus.success);
            if (failed.length) {
                console.log(`failed to parse ${failed.length}/${reports.length - failed.length} items`);
                console.log('---------------------------------------------------------');
                failed.forEach(r => console.log(`${contracts.ParseStatus[r.status]}, url: ${r.url}, \nreason: ${r.reason}`));
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion7(): Promise<void> {
    const version = 7;
    console.log(`apply ver${version}`);
    return cardDB.findById('arcanegiant').exec()
        .then(card => {
            if (card === null) {
                console.log('One Night in Karazhan set not found => repopulate!');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards());
            } else {
                console.log('db already contains One Night in Karazhan');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion8(): Promise<void> {
    const version = 8;
    console.log(`apply ver${version}`);
    return cardDB.find({ 'cardSet': hstypes.CardSet.OneNightInKarazhan }).exec()
        .then(cards => {
            console.log('fix OneNightInKarazhan cards: set cost to 0. Remove bad deck');
            cards.forEach(c => c.cost = 0);
            return cards;
        })
        .map((card: CardDB) => card.save())
        .then(() => Deck.findById('84faab928966370df48ead085c6881a5ece742d4').exec())
        .then(badDeck => badDeck.remove())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion9(): Promise<void> {
    const version = 9;
    console.log(`apply ver${version}`);
    return cardDB.findById('charge').exec()
        .then(card => {
            if (!card || card.mana !== 1) {
                console.log('apply card nerf from 2016/10/03');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards());
            } else {
                console.log('db already contains nerf from 2016/10/03');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion10(): Promise<void> {
    const version = 10;
    const cardHash: { [index: string]: CardDB } = {};
    console.log(`apply ver${version}`);
    return cardDB.findById('emperorthaurissan').exec()
        .then(card => {
            if (!card || card.cost > 0) {
                console.log('card cost correction needed');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards())
                    .then(() => cardDB.find({ 'cardSet': { '$in': hstypes.standardCardSets } }).exec())
                    .then(cards => cards.forEach(c => cardHash[c.id] = c))
                    .then(() => Deck.find().exec())
                    .map((deck: DeckDB<string>) => {
                        const calculatedCost = deck.cards
                            .map(c => ({ card: cardHash[c.card], count: c.count }))
                            .reduce((cost, cardCount) => cost + cardCount.card.cost * cardCount.count, 0);
                        if (deck.cost !== calculatedCost) {
                            console.log(`${deck.id}: ${deck.cost} <> ${calculatedCost} (calculated), "${deck.name}"`);
                        }
                        deck.cost = calculatedCost;
                        return deck.save();
                    });
            } else {
                console.log('card cost correction already applied');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion11(): Promise<void> {
    const version = 11;
    console.log(`apply ver${version}`);
    console.log(`patching revisions`);

    const cardHash: { [index: string]: CardDB } = {};
    let revCardsArray: contracts.CardCount<string>[][];
    // get decks with more than 1 revision
    // return Deck.find({"revisions.1": { $exists: true }}).exec()
    // get decks that have atleast 1 revision
    return cardDB.find().exec()
        .then(cards => cards.forEach(c => cardHash[c.id] = c))
        .then(() => Deck.find({ revisions: { $gt: [] } }).exec())
        .then(decks => {

            return Promise.all(decks.map((deck: DeckDB<string>) => {
                revCardsArray = [];
                deck.revisions.forEach((rev: DeckRevisionDB<string>, index: number) => {
                    const revCards = deckDiffer.reverse(deck.cards, rev.cardAddition, rev.cardRemoval);
                    revCardsArray.push(revCards);

                    // diff inversion:
                    const diff = deckDiffer.diff((revCardsArray[index - 1] || deck.cards), revCards);
                    rev.diff = diff.diff;
                    rev.cardAddition = diff.cardAddition;
                    rev.cardRemoval = diff.cardRemoval;
                    // cost
                    rev.cost = revCards.reduce((acc, cc) => acc + cc.count * cardHash[cc.card].cost, 0);
                });
                return deck.save();
            }));
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion12(): Promise<void> {
    const version = 12;
    console.log(`apply ver${version}`);
    return cardDB.findById('abyssalenforcer').exec()
        .then(card => {
            if (card === null) {
                console.log('Mean Streets of Gadgetzan set not found => repopulate!');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards());
            } else {
                console.log('db already contains Mean Streets of Gadgetzan');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion13(): Promise<void> {
    const version = 13;
    console.log(`apply ver${version}`);
    return cardDB.findById('wisp').exec()
        .then(card => {
            if (card === null) {
                console.log('0 mana neutrals not found => repopulate!');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards());
            } else {
                console.log('db already has fix card collection');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion14(): Promise<void> {
    const version = 14;
    console.log(`apply ver${version}`);
    return cardDB.findById('cthun').exec()
        .then(testCard => {
            if (testCard.cost > 0) {
                console.log('fix C\'Thun');
                return cardDB.find({ $or: [{ _id: 'cthun' }, { _id: 'beckonerofevil' }] }).exec()
                    .map((card: CardDB) => {
                        card.cost = 0;
                        return card.save();
                    });

            } else {
                console.log('C\'thun is fixed');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}
function updateToVersion15(): Promise<void> {
    const version = 15;
    console.log(`apply ver${version}`);
    return cardDB.findById('small-timebuccaneer').exec()
        .then(testCard => {
            if (testCard.health !== 1) {
                console.log('Patch 7.1.0.17720 (2017-02-28)');
                return cardDB.find({ $or: [{ _id: 'small-timebuccaneer' }, { _id: 'spiritclaws' }] }).exec()
                    .map((card: CardDB) => {
                        if (card.id === 'small-timebuccaneer') {
                            card.health = 1;
                            card.img = 'http://media-hearth.cursecdn.com/avatars/317/614/49759.png';
                        } else {
                            card.mana = 2;
                            card.img = 'http://media-hearth.cursecdn.com/avatars/317/611/42042.png';
                        }
                        return card.save();
                    });

            } else {
                console.log('Patch 7.1.0.17720 (2017-02-28) already applied');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion16(): Promise<void> {
    const version = 16;
    console.log(`apply ver${version}`);
    return cardDB.findById('dinosize').exec()
        .then(card => {
            if (card === null) {
                console.log('Journey to Un\'Goro set not found => repopulate!');
                return cardDB.remove({}).exec()
                    .then(() => parser.populateWithCards());
            } else {
                console.log('db already contains Journey to Un\'Goro');
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

// duplicate, but leave it as such because of version numbers..
function updateToVersion17(): Promise<void> {
    const version = 17;
    console.log(`dummy ver${version}`);
    return Promise.resolve();
}


function updateToVersion18(): Promise<any> {
    const version = 18;
    let hsJson: HSJSONCard[];

    return getJSON('https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json')
        .then(rez => hsJson = rez)
        .then(() => cardDB.find().exec())
        .then(cards => {
            console.log('add dbfId, id and text from hearthstonejson');
            const hash: { [index: string]: HSJSONCard } = {};
            hsJson.forEach(cardJson => {
                hash[cardDB.generateId(cardJson.name)] = cardJson;
            });
            cards.forEach(c => {
                const cardJson = hash[c._id];
                c.dbfId = cardJson.dbfId;
                c.officialId = cardJson.id;
            });
            return cards;
        })
        .map((card: CardDB) => card.save())
        .then(() => console.log(`apply ver${version}`));
}
function updateToVersion19() {
    const version = 19;
    const cardHash: { [index: string]: CardDB } = {};

    console.log(`apply ver${version}`);
    console.log('set deck/rev standart + import codes');
    return cardDB.find().exec()
        .then(cards => cards.forEach(c => cardHash[c.id] = c))
        .then(() => Deck.find().exec())
        .then((decks: DeckDB<string>[]) => {
            decks.forEach(deck => {
                deck.standart = deck.cards.every(c => hstypes.hsTypeConverter.isStandart(cardHash[c.card]));
                deck.importCode = deckEncoder.encode(deck.class, deck.standart, deck.cards.map(c => ({ card: cardHash[c.card], count: c.count })));

                deck.revisions.forEach(r => {
                    const revCards = deckDiffer
                        .reverse(deck.cards, r.cardAddition, r.cardRemoval)
                        .map(cardMin => ({ card: cardHash[cardMin.card], count: cardMin.count }));
                    r.standart = revCards.every(c => hstypes.hsTypeConverter.isStandart(c.card));
                    r.importCode = deckEncoder.encode(deck.class, r.standart, revCards);
                });
            });
            return decks;
        })
        .map((deck: DeckDB<CardDB>) => deck.save())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion20() {
    const version = 20;
    let hsJson: HSJSONCard[];


    console.log(`apply ver${version}, repopulate cards to include quest rogue nerf`);
    return cardDB.remove({}).exec()
        .then(() => parser.populateWithCards())
        .then(() => getJSON('https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json'))
        .then(rez => hsJson = rez)
        .then(() => cardDB.find().exec())
        .then(cards => {
            console.log('add card keywords from hearthstonejson');
            const hash: { [index: string]: HSJSONCard } = {};
            hsJson.forEach(cardJson => {
                hash[cardDB.generateId(cardJson.name)] = cardJson;
            });
            cards.forEach(c => {
                const cardJson = hash[c._id];

                c.keywords = [c.name, cardJson.race, ...(cardJson.mechanics || []), cardJson.rarity, cardJson.type, c.description]
                    .filter(keyword => !!keyword).join('$$$').toLocaleUpperCase();
            });
            return cards;
        })
        .map((card: CardDB) => card.save())
        .then(() => console.log(`apply ver${version}`));
}

function updateToVersion21() {
    const version = 21;

    console.log(`apply ver${version}, repopulate cards`);
    return cardDB.remove({}).exec()
        .then(() => parser.populateWithCards())
        .then(() => console.log(`apply ver${version}`));
}

function updateToVersion22() {
    const version = 22;

    console.log(`apply ver${version}, repopulate cards to include KotFT`);
    return cardDB.remove({}).exec()
        .then(() => parser.populateWithCards())
        .then(() => console.log(`apply ver${version}`));
}

function updateToVersion23() {
    const version = 23;

    console.log(`apply ver${version}, repopulate cards to include KaC`);
    return cardDB.remove({}).exec()
        .then(() => parser.populateWithCards())
        .then(() => console.log(`apply ver${version}`));
}

