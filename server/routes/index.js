"use strict";
var express = require("express");
var decks_1 = require("./decks");
var parsers_1 = require("./parsers");
var login_1 = require("./login");
function default_1(app) {
    app.use("/decks", decks_1.default);
    app.use("/parse", parsers_1.default);
    app.use("/", login_1.default);
    //landing
    var mainRouter = express.Router();
    mainRouter.get("/", function (req, res) {
        res.render("index");
    });
    mainRouter.get("/about", function (req, res) {
        res.render("about");
    });
    app.use("/", mainRouter);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=index.js.map