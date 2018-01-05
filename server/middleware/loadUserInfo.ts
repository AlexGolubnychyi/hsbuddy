import {Request, Response, NextFunction} from 'express';
import User from '../db/user';
import { TokenPayload } from '../../interfaces';

export function loadUserInfo(req: Request & {user?: any}, res: Response, next: NextFunction) {
    const payload = req.user as TokenPayload;
    if (!payload) {
        next();
        return;
    }

    User.loadUser(payload.username).then(user => {
        req.user = res.locals.user = user ? payload.username : undefined;
        next();
    });
}
