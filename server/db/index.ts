"use strict";

import * as path from "path";
import * as Promise from "bluebird";
import * as loki from "lokijs";
import * as schema from "./schema";
import * as fs from "fs";
let writeFile = Promise.promisify(fs.writeFile) as (name, data, options) => Promise<{}>;

let dbLocation = path.join(__dirname, "db.json");

class DbUtils {
    private db: Loki;
    private initialized: boolean = false;
    private _loadDb: (options: {}) => Promise<void>;
    private _saveDb: () => Promise<void>;
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
        this.doInitCheck();
        return this.db.getCollection(this.collections.cards);
    }

    getDecks() {
        this.doInitCheck();
        return this.db.getCollection(this.collections.decks);
    }

    getCardAvailability(userId: string, cardId: string) {
        var item = <schema.DBAvailability>this.getCardAvailabilityItem(userId, cardId);
        return item ? item.count : 0;

    }

    setCardAvailability(userId: string, cardId: string, count: number) {
        var item = <schema.DBAvailability>this.getCardAvailabilityItem(userId, cardId);
        if (item) {
            item.count = count;
            this.db.getCollection(this.collections.availability).update(item);
            return;
        }
        item = { cardId: cardId, count: count, userId: userId };
        this.db.getCollection(this.collections.availability).insert(item);
    }

    getDb() {
        if (this.initialized) {
            return Promise.resolve(this.db);
        }
        return this.init().then(() => this.db);
    }

    saveDb() {
        if (!this.initialized) {
            return Promise.reject("db is not initialized");
        }

        return this._saveDb();
    }

    generateCardId(name: string) {
        return name.toLowerCase().replace(/[ |,|`|.|']*/g, "");
    }

    private doInitCheck() {
        if (!this.initialized) {
            throw "db is not inilialized";
        }
    }

    private init() {
        this.db = new loki(dbLocation);
        this._loadDb = <any>Promise.promisify(this.db.loadDatabase.bind(this.db));
        this._saveDb = <any>Promise.promisify(this.db.saveDatabase.bind(this.db));
        return writeFile(dbLocation, "", { flag: "wx" })
                .catch(() => console.log("db exists"))
                .then(() => this._loadDb({}))
                .then(() => {
                    this.inflate();
                    this.initialized = true;
                    return this._saveDb();
                });
    }


    private inflate = () => {
        let cards = this.db.getCollection(this.collections.cards);
        if (cards) {
            return;
        }

        this.db.addCollection(this.collections.decks, {
            unique: ["name"]
        });

        this.db.addCollection(this.collections.cards, {
            unique: ["id"]
        });

        this.db.addCollection(this.collections.availability, {
            indices: ["userId", "cardId"]
        });

        this.db.addCollection(this.collections.user, {
            unique: ["userId"]
        });
    }

    private getCardAvailabilityItem(userId: string, cardId: string) {
        this.doInitCheck();
        return this.db.getCollection(this.collections.availability).findOne({
            "$and": [
                { "userId": { "$eq": userId } },
                { "cardId": { "$eq": cardId } }
            ]
        });
    }

}
export default new DbUtils();
export * from "./schema";