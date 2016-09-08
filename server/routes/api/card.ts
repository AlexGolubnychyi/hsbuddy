"use strict";

import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import UserCard from "../../db/userCard";
import Deck from "../../db/deck";
import Card from "../../db/card";

let router = express.Router();

router.get("/library", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Card.getCardLibraryInfo(req.user).then((cards) => res.json(cards));
});

router.get("/missing", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Deck.getMissingCards(req.user, req.query).then((cards) => res.json(cards));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    UserCard.setWithChecks(req.user, req.params.cardId, req.params.number).then(() => res.end());
});

export default router;