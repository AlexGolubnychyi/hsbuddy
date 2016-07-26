"use strict";

import dbUtils, {DBDeck} from "../db";
import * as express from "express";
import {Deck, Card, DeckQuery, deckQuery} from "../../interfaces";
import * as authChecks from "../middleware/authChecks";
import * as hstypes from "../../interfaces/hs-types";

let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user).then(decks => res.render("decks", { decks }));
});

router.get("/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user).then(decks => res.json(decks));
});


// "/data/:...params"
let deckQueryRoute = Object.keys(deckQuery).reduce((acc, param) => `${acc}/${param}/:${param}`, "/data");
router.get(deckQueryRoute, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user, req.params).then(decks => res.json(decks));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    dbUtils.ensureDb().then(() => {
        dbUtils.setCardAvailability(req.user, req.params.cardId, req.params.number);
        return dbUtils.saveDb();
    }).then(() => res.end());
});

router.get("/toggleuserdeck/:deckId/:status", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    dbUtils.ensureDb().then(() => {
        req.params.status === "true"
            ? dbUtils.addUserDeck(req.user, req.params.deckId)
            : dbUtils.removeUserDeck(req.user, req.params.deckId);

        return dbUtils.saveDb();
    }).then(() => res.end());
});

function getDecks(userId, params?: DeckQuery) {
    return dbUtils.ensureDb().then(db => {
        let query = void 0,
            costRemainingParam,
            userDeckIds = dbUtils.getUserDeckIds(userId),
            userCollection = false;

        if (params) {
            let queryParts = [];

            if (params.userCollection === "true") {
                queryParts.push({ "id": { "$in": userDeckIds } });
            }

            if (+params.deckClass > 0) {
                queryParts.push({ "class": +params.deckClass });
            }

            if (+params.costRemaining !== -1) {
                costRemainingParam = +params.costRemaining;
            }

            if (queryParts.length === 1) {
                query = queryParts[0];
            }
            else if (queryParts.length > 0) {
                query = { "$and": queryParts };
            }
        }

        let decks = (<any>dbUtils.getDecks().find(query) as DBDeck[])
            .map(deck => {
                let deckResult: Deck = Object.assign({}, deck),
                    costRemaining = deck.cost,
                    collected = true;

                deckResult.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card: Card = Object.assign({}, dbUtils.getCards().findOne({ id }));
                        card.count = deck.cards[id];
                        card.numberAvailable = dbUtils.getCardAvailability(userId, card.id);
                        card.className = hstypes.CardClass[card.class];
                        card.setName = <string>hstypes.hsTypeConverter.cardSet(card.set);
                        collected = collected && card.numberAvailable >= card.count;
                        costRemaining -= Math.min(card.count, card.numberAvailable) * card.cost;
                        return card;
                    }).sort(sortFunc);
                deckResult.className = hstypes.CardClass[deckResult.class];
                deckResult.costRemaining = costRemaining;
                deckResult.collected = collected;
                deckResult.userCollection = userCollection || userDeckIds.indexOf(deckResult.id) >= 0;
                return deckResult;
            });

        if (typeof costRemainingParam === "number") {
            decks = decks.filter(d => d.costRemaining < costRemainingParam);
        }

        return decks.sort((f, s) => f.costRemaining - s.costRemaining);
    });
}

function weightCard(card: Card) {

    let baseWeight = card.mana; // + (card.class === "neutral" ? 1000 : 0),

    if (card.set === hstypes.CardSet.Basic) {
        return baseWeight;
    }

    switch (card.rarity) {
        case hstypes.CardRarity.legendary: return baseWeight + 400;
        case hstypes.CardRarity.epic: return baseWeight + 300;
        case hstypes.CardRarity.rare: return baseWeight + 200;
        case hstypes.CardRarity.common: return baseWeight + 100;
    }

    return baseWeight;
}

function sortFunc(card1: Card, card2: Card) {
    let diff = weightCard(card1) - weightCard(card2);
    if (diff) {
        return diff;
    }
    return card1.name > card2.name ? 1 : -1;
}


export default router;
