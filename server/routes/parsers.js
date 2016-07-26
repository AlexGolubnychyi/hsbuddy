"use strict";
var Promise = require("bluebird");
var express = require("express");
var authChecks = require("../middleware/authChecks");
var parsers_1 = require("../parsers");
var router = express.Router();
// router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     hearthpwnParse()
//         .then(() => res.write("<p>hearthpwn done<p>"))
//         .then(() => icyveinsParse())
//         .then(() => res.write("<p>icyveins done<p>"))
//         .then(() => metabombParse())
//         .then(() => res.write("<p>metabomb done<p>"))
//         .then(() => res.write("<h1>All Done!!!<h1>"))
//         .catch(e => res.write("internal error"))
//         .finally(() => res.end());
// });
router.get("/", authChecks.url, function (req, res, next) {
    res.render("parser");
});
router.post("/", authChecks.api, function (req, res, next) {
    var links = req.body.links.replace(/[\n|\r]+/g, "|").split("|");
    res.write("<p>working, please wait..</p>");
    Promise
        .each(links.map(function (link) { return parsers_1.default.parse([link]); }), function (reports) {
        reports.forEach(function (report) {
            res.write("<div>[" + parsers_1.ParseStatus[report.status] + "] " + report.url + ". " + report.reason + "</div>");
        });
    })
        .then(function () { return res.write("\n                <h2>All Done!</h2> \n                <div><a href=\"/\">Go to main</a></div>\n                <div><a href=\"/parse\">Go to parse</a></div>"); })
        .then(function () { return res.end(); });
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
//# sourceMappingURL=parsers.js.map