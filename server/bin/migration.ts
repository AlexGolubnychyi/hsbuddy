import mongoose from "../lib/mongoose";
import Card, { CardDB } from "../db/card";
import Deck, { DeckDB } from "../db/deck";
import * as hstypes from "../../interfaces/hs-types";
import * as contracts from "../../interfaces";
import version from "../db/version";
import parser from "../parsers";
import * as Promise from "bluebird";


let updates: (() => Promise<void>)[] = [
    updateToVersion1,
    updateToVersion2,
    updateToVersion3,
    updateToVersion4,
    updateToVersion5,
    updateToVersion6,
    updateToVersion7,
    updateToVersion8,
    updateToVersion9
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