import mongoose from "../lib/mongoose";
import Card, {CardDB} from "../db/card";
import Deck, {DeckDB} from "../db/deck";
import * as hstypes from "../../interfaces/hs-types";
import version from "../db/version";
import parser from "../parsers";
import * as Promise from "bluebird";


let updates: (() => Promise<void>)[] = [
    updateToVersion1, updateToVersion2, updateToVersion3, updateToVersion4, updateToVersion5
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
    console.log("apply ver1");
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
        .then(() => console.log("ver1 appplied successfully"));
}

function updateToVersion2(): Promise<void> {
    console.log("apply ver2");
    return Deck.find().exec()
        .then(decks => {
            console.log("add Deck.dateAdded");
            decks.forEach(d => d.dateAdded = d.dateAdded || new Date());
            return decks;
        }).map((deck: mongoose.model<DeckDB>) => deck.save())
        .then(() => console.log("ver2 appplied successfully"));
}

function updateToVersion3(): Promise<void> {
    console.log("apply ver3");
    return Card.find({ "cardSet": 0 }).exec()
        .then(cards => {
            console.log("fix Naxx cards");
            cards.forEach(c => c.cardSet = hstypes.CardSet.Naxxramas);
            return cards;
        }).map((card: mongoose.model<CardDB>) => card.save())
        .then(() => console.log("ver3 appplied successfully"));
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

