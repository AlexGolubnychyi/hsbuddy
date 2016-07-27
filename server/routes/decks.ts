"use strict";

import * as express from "express";
import * as contracts from "../../interfaces";
import * as authChecks from "../middleware/authChecks";
import * as hstypes from "../../interfaces/hs-types";
import UserCard from "../db/userCard";
import Deck from "../db/deck";
import User from "../db/user";

let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user).then(decks => res.render("decks", { decks }));
});

router.get("/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    getDecks(req.user, req.query).then(decks => res.json(decks));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    UserCard.setWithChecks(req.user, req.params.cardId, req.params.number).then(() => res.end());
});

router.get("/toggleuserdeck/:deckId/:status", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.setUserDeck(req.user, req.params.deckId, req.params.status === "true").then(() => res.end());
});

function getDecks(userId, params?: contracts.DeckQuery) {
    return Deck.getDecksByParams(userId, params);
}

export default router;
