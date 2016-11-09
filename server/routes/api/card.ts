"use strict";

import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import UserCard from "../../db/userCard";
import Deck from "../../db/deck";
import Card from "../../db/card";
import { Request } from "../index";
import * as contracts from "../../../interfaces";
import importCollection from "../../parsers/collectionParse";

let router = express.Router();

router.get("/library", (req: Request, res: express.Response, next: express.NextFunction) => {
    Card.getCardLibraryInfo(req.user).then((cards) => res.json(cards));
});

router.get("/missing", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getMissingCards(req.user, req.query).then((cards) => res.json(cards));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    UserCard.setWithChecks(req.user, req.params.cardId, req.params.number).then(() => res.end());
});

router.post("/import", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    return importCollection(req.user, req.body.username, req.body.password)
        .then(() => res.json(<contracts.Result>{ error: "", success: true }))
        .catch(error => res.json(<contracts.Result>{ error, success: false }));
});
export default router;