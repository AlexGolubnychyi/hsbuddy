import mongoose from "../lib/mongoose";
import Card, { CardDB } from "../db/card";
import Deck, { DeckDB, DeckRevisionDB } from "../db/deck";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces";
import version from "../db/version";
import parser from "../parsers";
import * as Promise from "bluebird";
import differ from "../db/utils/differ";


let updates: (() => Promise<void>)[] = [
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
    updateToVersion14
];

(function checkForUpdates() {
    console.log("check db for updates");
    version.getVersion().then(versionNumber => {

        let missingUpdates = updates.slice(versionNumber);
        if (!missingUpdates.length) {
            console.log("db is up to date");
            process.exit();
        }
        return Promise
            .each(missingUpdates, update => update())
            .then(() => console.log("all updates installed successfully"))
            .then(() => version.setVersion(updates.length))
            .then(() => console.log("db ver: " + updates.length))
            .then(() => process.exit());

    });
})();

//-------------------------updates-------------------------------------
function updateToVersion1(): Promise<void> {
    let version = 1;

    console.log(`apply ver${version}`);
    return Card.findOne().exec()
        .then(card => {
            if (card === null) {
                console.log("db is empty => population");
                return parser.populateWithCards();
            }
            else {
                console.log("db already contains cards");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion2(): Promise<void> {
    let version = 2;

    console.log(`apply ver${version}`);
    return Deck.find().exec()
        .then(decks => {
            console.log("add Deck.dateAdded");
            decks.forEach(d => d.dateAdded = d.dateAdded || new Date());
            return decks;
        }).map((deck: DeckDB<string>) => deck.save())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion3(): Promise<void> {
    let version = 3;

    console.log(`apply ver${version}`);
    return Card.find({ "cardSet": 0 }).exec()
        .then(cards => {
            console.log("fix Naxx cards");
            cards.forEach(c => c.cardSet = hstypes.CardSet.Naxxramas);
            return cards;
        }).map((card: CardDB) => card.save())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion4(): Promise<void> {
    let version = 4;

    console.log(`apply ver${version}`);
    return Deck.find({ name: "Pirate Warrior (Standard) deck list and guide - Hearthstone - July 2016" }).exec()
        .then(badDecks => {
            console.log("remove faulty pirate warrior deck");
            return badDecks;
        })
        .then(badDecks => Promise.map(badDecks, bd => bd.remove()))
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion5(): Promise<void> {
    let version = 5;

    console.log(`apply ver${version}`);
    console.log("fix cards from basic set to be free not common");
    return Card.find({ cardSet: 1 }).exec()
        .then(badDecks => Promise.map(badDecks, bc => {
            bc.rarity = hstypes.CardRarity.free;
            return bc.save();
        }))
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion6(): Promise<void> {
    let version = 6;
    let urls: string[];

    console.log(`apply ver${version}`);
    console.log("fix deck dates");
    return Deck.find().exec()
        .then(decks => {
            urls = decks.map(deck => deck.url);
            return Promise.map(decks, deck => deck.remove());
        })
        .then(() => parser.parse(void 0, urls))
        .then(reports => {
            let failed = reports.filter(r => r.status !== contracts.ParseStatus.success);
            if (failed.length) {
                console.log(`failed to parse ${failed.length}/${reports.length - failed.length} items`);
                console.log("---------------------------------------------------------");
                failed.forEach(r => console.log(`${contracts.ParseStatus[r.status]}, url: ${r.url}, \nreason: ${r.reason}`));
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion7(): Promise<void> {
    let version = 7;
    console.log(`apply ver${version}`);
    return Card.findById("arcanegiant").exec()
        .then(card => {
            if (card === null) {
                console.log("One Night in Karazhan set not found => repopulate!");
                return Card.remove({}).exec()
                    .then(() => parser.populateWithCards());
            }
            else {
                console.log("db already contains One Night in Karazhan");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion8(): Promise<void> {
    let version = 8;
    console.log(`apply ver${version}`);
    return Card.find({ "cardSet": hstypes.CardSet.OneNightInKarazhan }).exec()
        .then(cards => {
            console.log("fix OneNightInKarazhan cards: set cost to 0. Remove bad deck");
            cards.forEach(c => c.cost = 0);
            return cards;
        })
        .map((card: CardDB) => card.save())
        .then(() => Deck.findById("84faab928966370df48ead085c6881a5ece742d4").exec())
        .then(badDeck => badDeck.remove())
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion9(): Promise<void> {
    let version = 9;
    console.log(`apply ver${version}`);
    return Card.findById("charge").exec()
        .then(card => {
            if (!card || card.mana !== 1) {
                console.log("apply card nerf from 2016/10/03");
                return Card.remove({}).exec()
                    .then(() => parser.populateWithCards());
            }
            else {
                console.log("db already contains nerf from 2016/10/03");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion10(): Promise<void> {
    let version = 10;
    let cardHash: { [index: string]: CardDB } = {};
    console.log(`apply ver${version}`);
    return Card.findById("emperorthaurissan").exec()
        .then(card => {
            if (!card || card.cost > 0) {
                console.log("card cost correction needed");
                return Card.remove({}).exec()
                    .then(() => parser.populateWithCards())
                    .then(() => Card.find({ "cardSet": { "$in": hstypes.standardCardSets } }).exec())
                    .then(cards => cards.forEach(c => cardHash[c.id] = c))
                    .then(() => Deck.find().exec())
                    .map((deck: DeckDB<string>) => {
                        let calculatedCost = deck.cards
                            .map(c => ({ card: cardHash[c.card], count: c.count }))
                            .reduce((cost, cardCount) => cost + cardCount.card.cost * cardCount.count, 0);
                        if (deck.cost !== calculatedCost) {
                            console.log(`${deck.id}: ${deck.cost} <> ${calculatedCost} (calculated), "${deck.name}"`);
                        }
                        deck.cost = calculatedCost;
                        return deck.save();
                    });
            }
            else {
                console.log("card cost correction already applied");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion11(): Promise<void> {
    let version = 11;
    console.log(`apply ver${version}`);
    console.log(`patching revisions`);

    let cardHash: { [index: string]: CardDB } = {},
        revCardsArray: contracts.CardCount<string>[][];
    //get decks with more than 1 revision
    //return Deck.find({"revisions.1": { $exists: true }}).exec()
    //get decks that have atleast 1 revision
    return Card.find().exec()
        .then(cards => cards.forEach(c => cardHash[c.id] = c))
        .then(() => Deck.find({ revisions: { $gt: [] } }).exec())
        .then(decks => {

            return Promise.all(decks.map((deck: DeckDB<string>) => {
                revCardsArray = [];
                deck.revisions.forEach((rev: DeckRevisionDB<string>, index: number) => {
                    let revCards = differ.reverse(deck.cards, rev.cardAddition, rev.cardRemoval);
                    revCardsArray.push(revCards);

                    //diff inversion:
                    let diff = differ.diff((revCardsArray[index - 1] || deck.cards), revCards);
                    rev.diff = diff.diff;
                    rev.cardAddition = diff.cardAddition;
                    rev.cardRemoval = diff.cardRemoval;
                    //cost
                    rev.cost = revCards.reduce((acc, cc) => acc + cc.count * cardHash[cc.card].cost, 0);
                });
                return deck.save();
            }));
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion12(): Promise<void> {
    let version = 12;
    console.log(`apply ver${version}`);
    return Card.findById("abyssalenforcer").exec()
        .then(card => {
            if (card === null) {
                console.log("Mean Streets of Gadgetzan set not found => repopulate!");
                return Card.remove({}).exec()
                    .then(() => parser.populateWithCards());
            }
            else {
                console.log("db already contains Mean Streets of Gadgetzan");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}
function updateToVersion13(): Promise<void> {
    let version = 13;
    console.log(`apply ver${version}`);
    return Card.findById("wisp").exec()
        .then(card => {
            if (card === null) {
                console.log("0 mana neutrals not found => repopulate!");
                return Card.remove({}).exec()
                    .then(() => parser.populateWithCards());
            }
            else {
                console.log("db already has fix card collection");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}

function updateToVersion14(): Promise<void> {
    let version = 14;
    console.log(`apply ver${version}`);
    return Card.findById("cthun").exec()
        .then(testCard => {
            if (testCard.cost > 0) {
                console.log("fix C'Thun");
                return Card.find({ $or: [{ _id: "cthun" }, { _id: "beckonerofevil" }] }).exec()
                    .map((card: CardDB) => {
                        card.cost = 0;
                        return card.save();
                    });

            }
            else {
                console.log("C'thun is fixed");
            }
        })
        .then(() => console.log(`ver${version} appplied successfully`));
}