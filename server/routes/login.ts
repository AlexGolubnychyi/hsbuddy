'use strict';
import * as express from 'express';
import User, { UserDB } from '../db/user';
import { AuthResult, TokenPayload } from '../../interfaces';
import * as jwt from 'jsonwebtoken';
import { config } from '../lib/config';

export const loginRouter = express.Router();

loginRouter.post('/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.auth(req.body.username, req.body.password)
        .then(user => res.json(toAuthResult(user)))
        .catch(e => {
            res.json(<AuthResult>{ success: false, error: e.message });
        });
});

loginRouter.post('/register', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.createUser(req.body.username, req.body.password)
        .then(user => res.json(toAuthResult(user)))
        .catch(e => {
            res.json(<AuthResult>{ success: false, error: e.message });
        });
});

function toAuthResult(user: UserDB): AuthResult {
    return {
        success: true,
        token: jwt.sign({ username: user.id, exp: 9000000000 }, config.mySecret)
    };
}
