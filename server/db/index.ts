"use strict";

import * as path from "path";
import * as schema from "./schema";
import LokiDbBase from "./LokiDbBase";
import * as crypto from "crypto";
import parser from "../parsers";
import * as hstypes from "../../interfaces/hs-types";

let dbLocation = path.join(__dirname, "db.json");

class DbUtils extends LokiDbBase {

    constructor() {
        super(dbLocation);
    }

    collections = {
        cards: "cards",
        decks: "decks",
        cardTypes: "cardTypes",
        availability: "availability",
        user: "user"
    };

    getCards() {
        return <LokiCollection<schema.DBCard>>this.getCollection(this.collections.cards);
    }

    getDecks() {
        return <LokiCollection<schema.DBDeck>>this.getCollection(this.collections.decks);
    }

    getCardAvailability(userId: string, cardId: string) {
        if (!userId || !cardId) {
            return 0;
        }
        let card = <schema.DBCard>this.getCards().by("id", cardId);
        if (card && card.set === hstypes.CardSet.Basic) {
            return 2;
        }
        var item = <schema.DBAvailability>this.getCardAvailabilityItem(userId, cardId);
        return item ? item.count : 0;

    }

    setCardAvailability(userId: string, cardId: string, count: number) {
        let card = this.getCards().by("id", cardId),
            item = this.getCardAvailabilityItem(userId, cardId);
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
    }

    generateCardId(name: string) {
        return name.toLowerCase().replace(/[ |,|`|.|']*/g, "");
    }

    generateDeckHash(deck: schema.DBDeck) {
        let deckDNA = Object.keys(deck.cards).sort().map(key => key + deck.cards[key]).join("");
        return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
    }

    protected inflate(db: Loki) {
        let cards = db.getCollection(this.collections.cards);
        if (cards) {
            return;
        }

        console.log("[start] db inflate");

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

        return parser.populateWithCards(db).then(() => console.log("[done] db inflate"));
    }

    private getCardAvailabilityItem(userId: string, cardId: string) {
        return <schema.DBAvailability>this.getCollection(this.collections.availability).findOne({
            "$and": [
                { "userId": { "$eq": userId } },
                { "cardId": { "$eq": cardId } }
            ]
        });
    }
}

export default new DbUtils();
export * from "./schema";