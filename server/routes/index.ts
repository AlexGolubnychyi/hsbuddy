
import * as express from 'express';
import { loginRouter } from './login';
import { deckRouter } from './deck';
import { cardRouter } from './card';
import { parseRouter } from './parse';

export const apiRouter = express.Router();

apiRouter.use('/', loginRouter);
apiRouter.use('/deck', deckRouter);
apiRouter.use('/card', cardRouter);
apiRouter.use('/parse', parseRouter);

export interface Request extends express.Request {
  user: string;
}


