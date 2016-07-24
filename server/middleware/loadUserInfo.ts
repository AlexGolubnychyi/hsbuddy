import * as express from "express";
import dbUtils from "../db";

export default function (req: express.Request, res: express.Response, next: express.NextFunction) {
    let userId = req.session["user"];

    dbUtils.ensureDb()
        .then(() => {
            let user = dbUtils.getCollection(dbUtils.collections.user).by("userId", userId);
            if (user) {
                req.user = res.locals.user = userId;
            }
            next();
        })
}