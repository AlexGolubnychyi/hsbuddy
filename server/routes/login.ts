"use strict";
import * as express from "express";
import userUtils from "../db/user";

let router = express.Router();

router.get("/login", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.render("login");
});

router.post("/login", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    userUtils.auth(req.body.username, req.body.password)
        .then(() => {
            req.session["user"] = req.body.username;
            res.redirect("/");
        })
        .catch(e => {
            res.redirect("/login");
        });
});


router.get("/logout", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.session.destroy(function (err) {
        res.redirect("/");
    });
});

router.get("/register", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.render("register");
});

router.post("/register", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    userUtils.createUser(req.body.username, req.body.password)
        .then(() => {
            req.session["user"] = req.body.username;
            res.redirect("/");
        }).catch(e => {
            next(e);
        });
});

export default router;
