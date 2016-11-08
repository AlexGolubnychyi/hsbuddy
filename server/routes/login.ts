"use strict";
import * as express from "express";
import User, { UserDB } from "../db/user";
import { AuthResult, TokenPayload } from "../../interfaces";
import * as jwt from "jsonwebtoken";
import { config } from "../lib/config";

let router = express.Router();

router.post("/login", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.auth(req.body.username, req.body.password)
        .then(user => res.json(toAuthResult(user)))
        .catch(e => {
            res.json(<AuthResult>{ success: false, error: e.message });
        });
});

router.post("/register", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.createUser(req.body.username, req.body.password)
        .then(user => res.json(toAuthResult(user)))
        .catch(e => {
            res.json(<AuthResult>{ success: false, error: e.message });
        });
});

function getToken(payload: TokenPayload) {
    return jwt.sign(payload, config.mySecret);
}

function toAuthResult(user: UserDB) {
    return <AuthResult>{
        success: true,
        token: getToken({ username: user.id })
    };
}

export default router;
