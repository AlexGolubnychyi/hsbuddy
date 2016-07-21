"use strict";

import dbUtils from "../db";
import * as express from "express";
import {Deck, Card} from "../../interfaces";


let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks().then(decks => res.render("decks", { decks }));
});

router.get("/:userId/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.params.userId).then(decks => res.json(decks));
});

router.get("/:userId/changenumber/:cardId/:number", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    dbUtils.get().then(db => {
        let availability = db.availability[req.params.userId] || {};
        availability[req.params.cardId] = req.params.number;
        db.availability[req.params.userId] = availability;
        return dbUtils.save(db);
    }).then(() => res.end());
});

function getDecks(userId = "jess-eu") {
    return dbUtils.get().then(db => {
        let decks = Object.keys(db.decks)//.filter((d,i)=> i===0)
            .map(name => db.decks[name])
            .sort((f, s) => f.cost - s.cost)
            .map(deck => {
                let deckResult: Deck = Object.assign({}, deck),
                    costReduction = 0;

                deckResult.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card: Card = Object.assign({}, db.cards[id]);
                        card.count = deck.cards[id];
                        card.numberAvailable = (db.availability[userId] || {})[card.id] || 0;
                        costReduction += Math.min(card.count, card.numberAvailable) * card.cost;
                        return card;
                    }).sort((f, s) => weightCard(f) - weightCard(s));

                deckResult.costReduction = costReduction;
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
