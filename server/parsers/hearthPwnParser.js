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
var HearthPwnParser = (function (_super) {
    __extends(HearthPwnParser, _super);
    function HearthPwnParser() {
        _super.apply(this, arguments);
        this.siteName = "www.hearthpwn.com";
    }
    HearthPwnParser.prototype.parseDeckList = function (url, save) {
        return Promise.reject("not implemented");
        // console.log(`parsing ${url}`);
        // return dbUtils.ensureDb()
        //     .then(() => getContent(url))
        //     .then($ => {
        //         let unique = {};
        //         $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
        //         return Object.keys(unique);
        //     })
        //     .map((deckUrl: string) => this.parseDeck(deckUrl, false), { concurrency: 2 })
        //     .then(() => {
        //         if (save) {
        //             return dbUtils.saveDb();
        //         }
        //     });
    };
    HearthPwnParser.prototype.parseDeck = function (url, save) {
        var _this = this;
        console.log("parsing " + url);
        return utils_1.default(url).then(function ($) {
            var name = $(".deck-title").text(), cards = {};
            $(".class-listing .listing, .neutral-listing .listing").find("[data-id]").each(function (_, cardEl) {
                var $td = $(cardEl).closest("td"), info = $td.closest("td").text().trim().split("×"), cardName = info[0].trim(), count = +info[1].trim();
                cards[cardName] = count;
            });
            var _a = _this.addDeckUnsafe(name, url, cards), deck = _a[0], reportItem = _a[1];
            if (save && deck) {
                return db_1.default.saveDb().then(function () { return reportItem; });
            }
            return Promise.resolve(reportItem);
        });
    };
    HearthPwnParser.prototype.parse = function (url, save) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(url, save).then(function (item) { return [item]; });
        }
        return this.parseDeckList(url, save);
    };
    HearthPwnParser.prototype.isDeckUrl = function (url) {
        return /hearthpwn\.com\/decks\/[0-9]*/.test(url);
    };
    return HearthPwnParser;
}(baseDeckParser_1.BaseDeckParser));
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new HearthPwnParser();
//# sourceMappingURL=hearthpwnParser.js.map