"use strict";
var express = require("express");
var user_1 = require("../db/user");
var router = express.Router();
router.get("/login", function (req, res, next) {
    res.render("login");
});
router.post("/login", function (req, res, next) {
    user_1.default.auth(req.body.username, req.body.password)
        .then(function () {
        req.session["user"] = req.body.username;
        res.redirect("/");
    })
        .catch(function (e) {
        res.redirect("/login");
    });
});
router.get("/logout", function (req, res, next) {
    req.session.destroy(function (err) {
        res.redirect("/");
    });
});
router.get("/register", function (req, res, next) {
    res.render("register");
});
router.post("/register", function (req, res, next) {
    user_1.default.createUser(req.body.username, req.body.password)
        .then(function () {
        req.session["user"] = req.body.username;
        res.redirect("/");
    }).catch(function (e) {
        next(e);
    });
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
//# sourceMappingURL=login.js.map