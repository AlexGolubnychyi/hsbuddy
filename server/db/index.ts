"use strict";

import * as path from "path";
import * as schema from "./schema";
import LokiDbBase from "./lokiDbBase";
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
        userDecks: "userDecks",
        user: "user"
    };

    getCards() {
        return <LokiCollection<schema.DBCard>>this.getCollection(this.collections.cards);
    }

    getDecks() {
        return <LokiCollection<schema.DBDeck>>this.getCollection(this.collections.decks);
    }

    getUserDeckIds(userId: string): string[] {
        return <any>this.getCollection(this.collections.userDecks).find({ userId }).map((item: schema.DBUserDeck) => item.deckId);
    }

    addUserDeck(userId: string, deckId: string) {
        let collection = this.getCollection(this.collections.userDecks);
        let item = collection.findOne({ "$and": [{ userId }, { deckId }] });
        if (item) {
            return;
        }
        this.getCollection(this.collections.userDecks).insertOne(<schema.DBUserDeck>{ userId, deckId });
    }

    removeUserDeck(userId: string, deckId: string) {
        let collection = this.getCollection(this.collections.userDecks);
        let item = collection.findOne({ "$and": [{ userId }, { deckId }] });
        if (item) {
            collection.remove(item);
        }
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
        return name.toLowerCase().replace(/[ |,|`|.|'|:|"]*/g, "");
    }

    generateDeckId(deck: schema.DBDeck) {
        let deckDNA = Object.keys(deck.cards).sort().map(key => key + deck.cards[key]).join("");
        return crypto.createHmac("sha1", "it's just a deck").update(deckDNA).digest("hex");
    }

    private getCardAvailabilityItem(userId: string, cardId: string) {
        return <schema.DBAvailability>this.getCollection(this.collections.availability).findOne({
            "$and": [{ userId }, { cardId }]
        });
    }
    protected inflate(db: Loki) {
        let cards = db.getCollection(this.collections.cards);
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

        return parser.populateWithCards(db).then(() => console.log("[done] db inflate"));
    }
}

export default new DbUtils();
export * from "./schema";