"use strict";

import * as Promise from "bluebird";
import * as loki from "lokijs";
import * as fs from "fs";
let writeFile = Promise.promisify(fs.writeFile) as (name, data, options) => Promise<{}>;

abstract class LokiDbBase {
    private db: Loki;
    private initialized: boolean = false;
    private _loadDb: (options: {}) => Promise<void>;
    private _saveDb: () => Promise<void>;

    constructor(private dbLocation) { }

    ensureDb() {
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

    getCollection(name) {
        this.doInitCheck();
        return this.db.getCollection(name);
    }

    private init() {
        this.db = new loki(this.dbLocation);
        this._loadDb = <any>Promise.promisify(this.db.loadDatabase.bind(this.db));
        this._saveDb = <any>Promise.promisify(this.db.saveDatabase.bind(this.db));
        return writeFile(this.dbLocation, "", { flag: "wx" })
            .catch(() => console.log("db exists"))
            .then(() => this._loadDb({}))
            .then(() => {
                let thenable = this.inflate(this.db);

                if (thenable) {
                    return (<Promise<void>>thenable)
                        .then(() => this.initialized = true)
                        .then(() => this._saveDb());
                }

                this.initialized = true;
            })
            .then(() => this._saveDb());
    }

    private doInitCheck() {
        if (!this.initialized) {
            throw "db is not inilialized";
        }
    }

    protected abstract inflate(db: Loki): Promise<void> | void;

}

export default LokiDbBase