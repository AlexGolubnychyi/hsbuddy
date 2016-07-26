"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require("bluebird");
var db_1 = require("../db");
var utils_1 = require("./utils");
var baseDeckParser_1 = require("./baseDeckParser");
var keywords = { deckUrl: "deck-list", deckListUrl: "game-guides" };
var MetaBombParser = (function (_super) {
    __extends(MetaBombParser, _super);
    function MetaBombParser() {
        _super.apply(this, arguments);
        this.siteName = "hearthstone.metabomb.net";
    }
    MetaBombParser.prototype.parseDeckList = function (url, save) {
        var _this = this;
        console.log("parsing " + url);
        return db_1.default.ensureDb()
            .then(function () { return utils_1.default(url); })
            .then(function ($) {
            var unique = {};
            $("[href*=" + keywords.deckUrl + "]").each(function (inx, el) { return unique[$(el).prop("href")] = true; });
            return Object.keys(unique);
        })
            .map(function (deckUrl) { return _this.parseDeck(deckUrl, false); }, { concurrency: 2 })
            .then(function (reports) {
            if (save) {
                return db_1.default.saveDb().then(function () { return reports; });
            }
            return reports;
        });
    };
    MetaBombParser.prototype.parseDeck = function (url, save) {
        var _this = this;
        console.log("parsing " + url);
        return utils_1.default(url).then(function ($) {
            var name = $("main>article>header>h1").text(), cards = {};
            $("main table").first().find("tr").each(function (_, tr) {
                $(tr).find("td").each(function (inx, td) {
                    var $el = $(td).find("span[data-card]");
                    if (!$el.length) {
                        return;
                    }
                    var cardName = $el.first().text().trim(), count = +$el.parent().contents().first().text()[0];
                    cards[cardName] = count;
                });
            });
            var _a = _this.addDeckUnsafe(name, url, cards), deck = _a[0], reportItem = _a[1];
            if (save && deck) {
                return db_1.default.saveDb().then(function () { return reportItem; });
            }
            return reportItem;
        });
    };
    MetaBombParser.prototype.parse = function (url, save) {
        if (url.indexOf(keywords.deckListUrl) > 0) {
            return this.parseDeckList(url, save);
        }
        if (url.indexOf(keywords.deckUrl) > 0) {
            return this.parseDeck(url, save).then(function (reportItem) { return [reportItem]; });
        }
        Promise.reject("metabomb parser: unknown url: " + url);
    };
    return MetaBombParser;
}(baseDeckParser_1.BaseDeckParser));
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new MetaBombParser();
//# sourceMappingURL=metaBombParser.js.map