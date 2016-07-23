"use strict";

import dbUtils, {DBDeck} from "../db";
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
    dbUtils.getDb().then(() => {
        dbUtils.setCardAvailability(req.params.userId, req.params.cardId, req.params.number);
        return dbUtils.saveDb();
    }).then(() => res.end());
});

function getDecks(userId = "jess-eu") {
    return dbUtils.getDb().then(db => {

        let decks = (dbUtils.getDecks().find() as DBDeck[])
            .sort((f, s) => f.cost - s.cost)
            .map(deck => {
                let deckResult: Deck = Object.assign({}, deck),
                    costReduction = 0;

                deckResult.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card: Card = Object.assign({}, dbUtils.getCards().findOne({ "id": { "$eq": id } }));
                        card.count = deck.cards[id];
                        card.numberAvailable = dbUtils.getCardAvailability(userId, card.id);
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
