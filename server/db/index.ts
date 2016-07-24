"use strict";

import * as path from "path";
import * as schema from "./schema";
import LokiDbBase from "./LokiDbBase";
import * as crypto from "crypto";

let dbLocation = path.join(__dirname, "db.json");

class DbUtils extends LokiDbBase {

    constructor() {
        super(dbLocation);
    }

    hsClasses = {
        unknown: "unknown",
        neutral: "neutral",
        druid: "druid",
        hunter: "hunter",
        mage: "mage",
        paladin: "paladin",
        priest: "priest",
        rogue: "rogue",
        shaman: "shaman",
        warlock: "warlock",
        warrior: "warrior"
    };

    collections = {
        cards: "cards",
        decks: "decks",
        cardTypes: "cardTypes",
        availability: "availability",
        user: "user"
    };
    cardTypes = {
        free: 0,
        common: 40,
        rare: 100,
        epic: 400,
        legendary: 1600
    };

    getCards() {
        return this.getCollection(this.collections.cards);
    }

    getDecks() {
        return this.getCollection(this.collections.decks);
    }

    getCardAvailability(userId: string, cardId: string) {
        if (!userId || !cardId) {
            return 0;
        }
        var item = <schema.DBAvailability>this.getCardAvailabilityItem(userId, cardId);
        return item ? item.count : 0;

    }

    setCardAvailability(userId: string, cardId: string, count: number) {
        var item = <schema.DBAvailability>this.getCardAvailabilityItem(userId, cardId);
        if (item) {
            item.count = count;
            this.getCollection(this.collections.availability).update(item);
            return;
        }
        item = { cardId: cardId, count: count, userId: userId };
        this.getCollection(this.collections.availability).insert(item);
    }

    generateCardId(name: string) {
        return name.toLowerCase().replace(/[ |,|`|.|']*/g, "");
    }

    generateDeckHask(deck: schema.DBDeck) {
        let deckDNA = Object.keys(deck.cards).map(key => key + deck.cards[key]).join("");
        return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
    }

    parseHsClass(className){
        let name = className.trim().toLowerCase();
        if (Object.keys(this.hsClasses).some(key => name === key)){
            return name;
        }
        return this.hsClasses.unknown;
    }

    protected inflate(db: Loki) {
        let cards = db.getCollection(this.collections.cards);
        if (cards) {
            return;
        }

        db.addCollection(this.collections.decks, {
            unique: ["name"]
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
    }

    private getCardAvailabilityItem(userId: string, cardId: string) {
        return this.getCollection(this.collections.availability).findOne({
            "$and": [
                { "userId": { "$eq": userId } },
                { "cardId": { "$eq": cardId } }
            ]
        });
    }
}

export default new DbUtils();
export * from "./schema";