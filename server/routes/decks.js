"use strict";
var db_1 = require("../db");
var express = require("express");
var router = express.Router();
router.get("/", function (req, res, next) {
    getDecks().then(function (decks) { return res.render("decks", { decks: decks }); });
});
router.get("/data", function (req, res, next) {
    getDecks().then(function (decks) { return res.json(decks); });
});
function getDecks() {
    return db_1.default.get().then(function (db) {
        var decks = Object.keys(db.decks)
            .map(function (name) { return db.decks[name]; })
            .sort(function (f, s) { return f.cost - s.cost; })
            .map(function (deck) {
            var deckResult = Object.assign({}, deck);
            deckResult.cards = Object.keys(deck.cards)
                .map(function (id) {
                var card = Object.assign({}, db.cards[id]);
                card.count = deck.cards[id];
                card.numberAvailable = card.numberAvailable || 0;
                return card;
            }).sort(function (f, s) { return weightCard(f) - weightCard(s); });
            return deckResult;
        });
        return decks;
    });
}
function weightCard(card) {
    var baseWeight = card.mana, // + (card.class === "neutral" ? 1000 : 0),
    rarity = card.rarity.toLowerCase();
    if (card.set.toLowerCase() === "basic") {
        return baseWeight;
    }
    switch (rarity) {
        case "legendary": return baseWeight + 400;
        case "epic": return baseWeight + 300;
        case "rare": return baseWeight + 200;
        case "common": return baseWeight + 100;
    }
    return baseWeight;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
//# sourceMappingURL=decks.js.map