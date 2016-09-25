import * as express from "express";
import User from "../db/user";


export default function (req: express.Request, res: express.Response, next: express.NextFunction) {
    let userId = req.session["user"];

    User.find({ userId }).then(user => {
        if (user) {
            req["user"] = res.locals.user = userId;
        }
        next();
    });
}