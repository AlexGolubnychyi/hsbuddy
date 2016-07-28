"use strict";

import * as express from "express";
import * as contracts from "../../interfaces";
import * as authChecks from "../middleware/authChecks";
import * as hstypes from "../../interfaces/hs-types";
import UserCard from "../db/userCard";
import Card from "../db/card";


let router = express.Router();

router.get("/data", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Card.getAllCards(req.user).then(cards => res.json(cards));
});

router.get("/changenumber/:cardId/:number", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    UserCard.setWithChecks(req.user, req.params.cardId, req.params.number).then(() => res.end());
});


export default router;
