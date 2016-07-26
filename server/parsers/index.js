"use strict";
var url = require("url");
var Promise = require("bluebird");
var cardParse_1 = require("./cardParse");
var metaBombParser_1 = require("./metaBombParser");
var hearthpwnParser_1 = require("./hearthpwnParser");
var manaCrystalsParser_1 = require("./manaCrystalsParser");
var hearthstoneTopDecksParser_1 = require("./hearthstoneTopDecksParser");
var Parser = (function () {
    function Parser() {
        var _this = this;
        this.parsers = {};
        this.urlToTask = function (urlString) {
            var urlObj = url.parse(urlString);
            return {
                url: urlString,
                parser: _this.parsers[urlObj.hostname]
            };
        };
        [hearthpwnParser_1.default, manaCrystalsParser_1.default, hearthstoneTopDecksParser_1.default, metaBombParser_1.default]
            .forEach(function (p) { return _this.parsers[p.siteName] = p; });
    }
    Parser.prototype.parse = function (urls) {
        var tasks = urls.map(this.urlToTask);
        return Promise.map(tasks, function (t) { return !t.parser
            ? Promise.resolve([{ status: ParseStatus.parserNotFound, url: t.url, reason: "" }])
            : t.parser.parse(t.url, true); })
            .then(function (reports) { return reports.reduce(function (f, s) { return f.concat(s); }); });
    };
    Parser.prototype.populateWithCards = function (db) {
        console.log("[start] populate db with cards");
        return cardParse_1.default(db)
            .then(function () { return console.log("[done] populate db with cards"); });
    };
    return Parser;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new Parser();
(function (ParseStatus) {
    ParseStatus[ParseStatus["success"] = 0] = "success";
    ParseStatus[ParseStatus["failed"] = 1] = "failed";
    ParseStatus[ParseStatus["duplicate"] = 2] = "duplicate";
    ParseStatus[ParseStatus["parserNotFound"] = 3] = "parserNotFound";
})(exports.ParseStatus || (exports.ParseStatus = {}));
var ParseStatus = exports.ParseStatus;
//# sourceMappingURL=index.js.map