"use strict";
var express = require("express");
var decks_1 = require("./decks");
var router = express.Router();
function default_1(app) {
    app.use("/decks", decks_1.default);
    router.get("/", function (req, res) {
        res.redirect("/decks");
    });
    app.use("/", router);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=index.js.map