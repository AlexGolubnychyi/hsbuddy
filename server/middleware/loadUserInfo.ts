import * as express from "express";
import User from "../db/user";
import { TokenPayload } from "../../interfaces";

export default function (req: express.Request & {user?: any}, res: express.Response, next: express.NextFunction) {
    let payload = req.user as TokenPayload;
    if (!payload) {
        next();
        return;
    }

    User.find({ userId: payload.username }).then(user => {
        req.user = res.locals.user = user ? payload.username : undefined;
        next();
    });
}