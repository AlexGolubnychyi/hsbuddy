"use strict";
import * as express from "express";
import User from "../db/user";

let router = express.Router();

router.post("/login", (req: express.Request, res: express.Response, next: express.NextFunction) => {
     User.auth(req.body.username, req.body.password)
        .then(() => {
            req.session["user"] = req.body.username;
            res.json({ success: true });
            return null;
        })
        .catch(e => {
            res.json({ success: false, error: e.message });
        });
});


router.get("/logout", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.session.destroy(function (err) {
        res.redirect("/login");
    });
});

router.post("/register", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    User.createUser(req.body.username, req.body.password)
        .then(() => {
            req.session["user"] = req.body.username;
            res.json({ success: true });
            return null;
        }).catch(e => {
            res.json({ success: false, error: e.message });
        });
});

export default router;
