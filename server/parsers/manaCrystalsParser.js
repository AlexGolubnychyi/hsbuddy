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
var ManaCrystalsParser = (function (_super) {
    __extends(ManaCrystalsParser, _super);
    function ManaCrystalsParser() {
        _super.apply(this, arguments);
        this.siteName = "manacrystals.com";
    }
    ManaCrystalsParser.prototype.parseDeckList = function (url, save) {
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
    ManaCrystalsParser.prototype.parseDeck = function (url, save) {
        var _this = this;
        console.log("parsing " + url);
        return utils_1.default(url).then(function ($) {
            var name = $(".page-header").text().trim(), cards = {};
            $(".card-list-item").each(function (_, cardEl) {
                var $cardEl = $(cardEl), cardName = $cardEl.find(".card-name").text().trim(), count = +$cardEl.find(".quantity").text().trim();
                cards[cardName] = count;
            });
            var _a = _this.addDeckUnsafe(name, url, cards), deck = _a[0], reportItem = _a[1];
            if (save && deck) {
                return db_1.default.saveDb().then(function () { return reportItem; });
            }
            return reportItem;
        });
    };
    ManaCrystalsParser.prototype.parse = function (url, save) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(url, save).then(function (reportItem) { return [reportItem]; });
        }
        return this.parseDeckList(url, save);
    };
    ManaCrystalsParser.prototype.isDeckUrl = function (url) {
        return /manacrystals\.com\/deck_guides\/[0-9]*/.test(url);
    };
    return ManaCrystalsParser;
}(baseDeckParser_1.BaseDeckParser));
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new ManaCrystalsParser();
//# sourceMappingURL=manaCrystalsParser.js.map