"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path");
var LokiDbBase_1 = require("./LokiDbBase");
var crypto = require("crypto");
var parsers_1 = require("../parsers");
var hstypes = require("../../interfaces/hs-types");
var dbLocation = path.join(__dirname, "db.json");
var DbUtils = (function (_super) {
    __extends(DbUtils, _super);
    function DbUtils() {
        _super.call(this, dbLocation);
        this.collections = {
            cards: "cards",
            decks: "decks",
            cardTypes: "cardTypes",
            availability: "availability",
            userDecks: "userDecks",
            user: "user"
        };
    }
    DbUtils.prototype.getCards = function () {
        return this.getCollection(this.collections.cards);
    };
    DbUtils.prototype.getDecks = function () {
        return this.getCollection(this.collections.decks);
    };
    DbUtils.prototype.getUserDeckIds = function (userId) {
        return this.getCollection(this.collections.userDecks).find({ userId: userId }).map(function (item) { return item.deckId; });
    };
    DbUtils.prototype.addUserDeck = function (userId, deckId) {
        var collection = this.getCollection(this.collections.userDecks);
        var item = collection.findOne({ "$and": [{ userId: userId }, { deckId: deckId }] });
        if (item) {
            return;
        }
        this.getCollection(this.collections.userDecks).insertOne({ userId: userId, deckId: deckId });
    };
    DbUtils.prototype.removeUserDeck = function (userId, deckId) {
        var collection = this.getCollection(this.collections.userDecks);
        var item = collection.findOne({ "$and": [{ userId: userId }, { deckId: deckId }] });
        if (item) {
            collection.remove(item);
        }
    };
    DbUtils.prototype.getCardAvailability = function (userId, cardId) {
        if (!userId || !cardId) {
            return 0;
        }
        var card = this.getCards().by("id", cardId);
        if (card && card.set === hstypes.CardSet.Basic) {
            return 2;
        }
        var item = this.getCardAvailabilityItem(userId, cardId);
        return item ? item.count : 0;
    };
    DbUtils.prototype.setCardAvailability = function (userId, cardId, count) {
        var card = this.getCards().by("id", cardId), item = this.getCardAvailabilityItem(userId, cardId);
        if (card.rarity === hstypes.CardRarity.legendary) {
            count = Math.min(count, 1);
        }
        else {
            count = Math.min(count, 2);
        }
        if (item) {
            item.count = count;
            this.getCollection(this.collections.availability).update(item);
            return;
        }
        item = { cardId: cardId, count: count, userId: userId };
        this.getCollection(this.collections.availability).insert(item);
    };
    DbUtils.prototype.generateCardId = function (name) {
        return name.toLowerCase().replace(/[ |,|`|.|'|:|"]*/g, "");
    };
    DbUtils.prototype.generateDeckId = function (deck) {
        var deckDNA = Object.keys(deck.cards).sort().map(function (key) { return key + deck.cards[key]; }).join("");
        return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
    };
    DbUtils.prototype.getCardAvailabilityItem = function (userId, cardId) {
        return this.getCollection(this.collections.availability).findOne({
            "$and": [{ userId: userId }, { cardId: cardId }]
        });
    };
    DbUtils.prototype.inflate = function (db) {
        var cards = db.getCollection(this.collections.cards);
        if (cards) {
            return;
        }
        console.log("[start] db inflate");
        db.addCollection(this.collections.decks, {
            unique: ["id", "name"]
        });
        db.addCollection(this.collections.cards, {
            unique: ["id"]
        });
        db.addCollection(this.collections.availability, {
            indices: ["userId", "cardId"]
        });
        db.addCollection(this.collections.user, {
            unique: ["userId"]
        });
        db.addCollection(this.collections.userDecks, {
            indices: ["userId", "deckId"]
        });
        return parsers_1.default.populateWithCards(db).then(function () { return console.log("[done] db inflate"); });
    };
    return DbUtils;
}(LokiDbBase_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new DbUtils();
//# sourceMappingURL=index.js.map