"use strict";

import dbUtils from "../db";
import * as express from "express";
import {Deck, Card} from "../../interfaces";

let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks().then(decks => res.render("decks", { decks }));
});

router.get("/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks().then(decks => res.json(decks));
});

function getDecks() {
    return dbUtils.get().then(db => {
        let decks = Object.keys(db.decks)
            .map(name => db.decks[name])
            .sort((f, s) => f.cost - s.cost)
            .map(deck => {
                let deckResult: Deck = Object.assign({}, deck);

                deckResult.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card: Card = Object.assign({}, db.cards[id]);
                        card.count = deck.cards[id];
                        card.numberAvailable = card.numberAvailable || 0;
                        return card;
                    }).sort((f, s) => weightCard(f) - weightCard(s));

                return deckResult;
            });

        return decks;
    });
}


function weightCard(card) {

    let baseWeight = card.mana, // + (card.class === "neutral" ? 1000 : 0),
        rarity = card.rarity.toLowerCase();

    if (card.set.toLowerCase() === "basic") {
        return baseWeight;
    }

    switch (rarity) {
        case "legendary": return baseWeight + 400;
        case "epic": return baseWeight + 300;
        case "rare": return baseWeight + 200;
        case "common": return baseWeight + 100;
    }

    return baseWeight;
}


export default router;
