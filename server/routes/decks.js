"use strict";
var db_1 = require("../db");
var express = require("express");
var authChecks = require("../middleware/authChecks");
var hstypes = require("../../interfaces/hs-types");
var router = express.Router();
router.get("/", function (req, res, next) {
    getDecks(req.user).then(function (decks) { return res.render("decks", { decks: decks }); });
});
router.get("/data", function (req, res, next) {
    getDecks(req.user, req.query).then(function (decks) { return res.json(decks); });
});
router.get("/changenumber/:cardId/:number", authChecks.api, function (req, res, next) {
    db_1.default.ensureDb().then(function () {
        db_1.default.setCardAvailability(req.user, req.params.cardId, req.params.number);
        return db_1.default.saveDb();
    }).then(function () { return res.end(); });
});
router.get("/toggleuserdeck/:deckId/:status", authChecks.api, function (req, res, next) {
    db_1.default.ensureDb().then(function () {
        req.params.status === "true"
            ? db_1.default.addUserDeck(req.user, req.params.deckId)
            : db_1.default.removeUserDeck(req.user, req.params.deckId);
        return db_1.default.saveDb();
    }).then(function () { return res.end(); });
});
function getDecks(userId, params) {
    return db_1.default.ensureDb().then(function (db) {
        var query = void 0, dustNeededParam, userDeckIds = db_1.default.getUserDeckIds(userId), userCollection = false;
        if (params) {
            var queryParts = [];
            if (params.userCollection === "true") {
                queryParts.push({ "id": { "$in": userDeckIds } });
            }
            if (+params.deckClass > 0) {
                queryParts.push({ "class": +params.deckClass });
            }
            if (params.dustNeeded) {
                dustNeededParam = +params.dustNeeded;
            }
            if (queryParts.length === 1) {
                query = queryParts[0];
            }
            else if (queryParts.length > 0) {
                query = { "$and": queryParts };
            }
        }
        var decks = db_1.default.getDecks().find(query)
            .map(function (deck) {
            var deckResult = Object.assign({}, deck), dustNeeded = deck.cost, collected = true;
            deckResult.cards = Object.keys(deck.cards)
                .map(function (id) {
                var card = Object.assign({}, db_1.default.getCards().findOne({ id: id }));
                card.count = deck.cards[id];
                card.numberAvailable = db_1.default.getCardAvailability(userId, card.id);
                card.className = hstypes.CardClass[card.class];
                card.setName = hstypes.hsTypeConverter.cardSet(card.set);
                collected = collected && card.numberAvailable >= card.count;
                dustNeeded -= Math.min(card.count, card.numberAvailable) * card.cost;
                return card;
            }).sort(sortFunc);
            deckResult.className = hstypes.CardClass[deckResult.class];
            deckResult.dustNeeded = dustNeeded;
            deckResult.collected = collected;
            deckResult.userCollection = userCollection || userDeckIds.indexOf(deckResult.id) >= 0;
            return deckResult;
        });
        if (typeof dustNeededParam === "number") {
            decks = decks.filter(function (d) { return d.dustNeeded < dustNeededParam; });
        }
        return decks.sort(function (f, s) { return f.dustNeeded - s.dustNeeded; });
    });
}
function weightCard(card) {
    var baseWeight = card.mana; // + (card.class === "neutral" ? 1000 : 0),
    if (card.set === hstypes.CardSet.Basic) {
        return baseWeight;
    }
    switch (card.rarity) {
        case hstypes.CardRarity.legendary: return baseWeight + 400;
        case hstypes.CardRarity.epic: return baseWeight + 300;
        case hstypes.CardRarity.rare: return baseWeight + 200;
        case hstypes.CardRarity.common: return baseWeight + 100;
    }
    return baseWeight;
}
function sortFunc(card1, card2) {
    var diff = weightCard(card1) - weightCard(card2);
    if (diff) {
        return diff;
    }
    return card1.name > card2.name ? 1 : -1;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
//# sourceMappingURL=decks.js.map