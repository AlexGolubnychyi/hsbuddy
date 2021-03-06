import * as express from 'express';
import * as authChecks from '../middleware/authChecks';
import User from '../db/user';
import Deck from '../db/deck';
import {Request} from './index';

export const deckRouter = express.Router();

deckRouter.get('/', (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getDecksByParams(req.user, req.query).then(decks => res.json(decks));
});

deckRouter.get('/:deckId', (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getDeck(req.user, req.params.deckId).then(deck => res.json(deck));
});
deckRouter.get('/:deckId/similar', (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.getSimilarDecks(req.user, req.params.deckId, req.query.standart === 'true').then(deck => res.json(deck));
});

deckRouter.delete('/:deckId', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.recycle(req.params.deckId, true).then(() => res.end());
});

deckRouter.post('/:deckId', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    Deck.setDescription(req.user, req.params.deckId, req.body).then(result => res.json(result));
});

deckRouter.get('/collection/:deckId/:status', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    User.setUserDeck(req.user, req.params.deckId, req.params.status === 'true').then(result => res.json(result));
});
deckRouter.get('/ignore/:deckId/:status', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    User.setIgnoredDeck(req.user, req.params.deckId, req.params.status === 'true').then(result => res.json(result));
});

