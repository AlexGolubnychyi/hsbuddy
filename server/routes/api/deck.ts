"use strict";

import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import User from "../../db/user";
import Deck from "../../db/deck";

let router = express.Router();

router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Deck.getDecksByParams(req.user, req.query).then(decks => res.json(decks));
});

router.get("/:deckId", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    //Deck.getDeckDetail(req.user, req.params.deckId).then(deck => res.json(deck));
});

router.get("/collection/:deckId/:status", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.setUserDeck(req.user, req.params.deckId, req.params.status === "true").then(() => res.end());
});

export default router;