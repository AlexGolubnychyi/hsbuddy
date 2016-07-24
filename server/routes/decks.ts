"use strict";

import dbUtils, {DBDeck} from "../db";
import * as express from "express";
import {Deck, Card} from "../../interfaces";
import * as authChecks from "../middleware/authChecks";

let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user).then(decks => res.render("decks", { decks }));
});

router.get("/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user).then(decks => res.json(decks));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {

    dbUtils.ensureDb().then(() => {
        dbUtils.setCardAvailability(req.user, req.params.cardId, req.params.number);
        return dbUtils.saveDb();
    }).then(() => res.end());
});

function getDecks(userId) {
    return dbUtils.ensureDb().then(db => {

        let decks = (dbUtils.getDecks().find() as DBDeck[])
            .map(deck => {
                let deckResult: Deck = Object.assign({}, deck),
                    costRemaining = deck.cost,
                    collected = true;

                deckResult.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card: Card = Object.assign({}, dbUtils.getCards().findOne({ "id": { "$eq": id } }));
                        card.count = deck.cards[id];
                        card.numberAvailable = dbUtils.getCardAvailability(userId, card.id);
                        collected = collected && card.numberAvailable >= card.count;
                        costRemaining -= Math.min(card.count, card.numberAvailable) * card.cost;
                        return card;
                    }).sort((f, s) => weightCard(f) - weightCard(s));

                deckResult.costRemaining = costRemaining;
                deckResult.collected = collected;
                return deckResult;
            }).sort((f, s) => f.costRemaining - s.costRemaining);

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
