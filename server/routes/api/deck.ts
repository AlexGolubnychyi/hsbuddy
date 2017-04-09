import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import User from "../../db/user";
import Deck from "../../db/deck";
import {Request} from "../index";

let router = express.Router();

router.get("/", (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getDecksByParams(req.user, req.query).then(decks => res.json(decks));
});

router.get("/:deckId", (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getDeck(req.user, req.params.deckId).then(deck => res.json(deck));
});
router.get("/:deckId/similar", (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getSimilarDecks(req.user, req.params.deckId, req.query.standart === "true").then(deck => res.json(deck));
});

router.delete("/:deckId", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.recycle(req.params.deckId, true).then(() => res.end());
});

router.post("/:deckId", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.setDescription(req.user, req.params.deckId, req.body).then(success => res.json({success}));
});

router.get("/collection/:deckId/:status", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    User.setUserDeck(req.user, req.params.deckId, req.params.status === "true").then(result => res.json(result));
});

export default router;
