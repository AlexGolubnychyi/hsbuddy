"use strict";
var db_1 = require("../db");
var hstypes = require("../../interfaces/hs-types");
var index_1 = require("./index");
var BaseDeckParser = (function () {
    function BaseDeckParser() {
    }
    BaseDeckParser.prototype.deckExistsUnsafe = function (deck) {
        var existingDecks = db_1.default.getDecks().find({ "id": deck.id });
        return !!(existingDecks && existingDecks.length);
    };
    BaseDeckParser.prototype.addDeckUnsafe = function (name, url, cards) {
        var deck = {
            id: "",
            name: name.trim(),
            class: hstypes.CardClass.unknown,
            url: url,
            cost: 0,
            costApprox: false,
            cards: {}
        };
        Object.keys(cards).map(function (cardName) {
            var cardId = db_1.default.generateCardId(cardName.trim()), count = cards[cardName], card = db_1.default.getCards().by("id", cardId);
            if (!card) {
                //console.log(`[not found] card ${cardName}`);
                return [null, { status1: index_1.ParseStatus.failed, reason: "card not found: " + card.name, url: url }];
            }
            deck.cards[cardId] = count;
            if (deck.class === hstypes.CardClass.unknown && card.class !== hstypes.CardClass.neutral) {
                deck.class = card.class;
            }
            if (typeof card.cost === "undefined") {
                deck.costApprox = true;
            }
            else {
                deck.cost += card.cost * count;
            }
        });
        deck.id = db_1.default.generateDeckId(deck);
        if (this.deckExistsUnsafe(deck)) {
            return [null, { status: index_1.ParseStatus.duplicate, reason: "", url: url }];
        }
        db_1.default.getDecks().insert(deck);
        return [deck, { status: index_1.ParseStatus.success, reason: "", url: url }];
    };
    return BaseDeckParser;
}());
exports.BaseDeckParser = BaseDeckParser;
//# sourceMappingURL=baseDeckParser.js.map