"use strict";

import * as fs from "fs";
import * as path from "path";
import * as Promise from "bluebird";

let writeFile = <any>Promise.promisify(fs.writeFile) as (src: string, constent: string) => Promise<{}>,
    readFile = <any>Promise.promisify(fs.readFile) as (src: string, encoding: string) => Promise<string>,
    dbLocation = path.join(__dirname, "db.json");

class DbUtils {
    get() {
        return readFile(dbLocation, "utf8").then(db => {
            return <DB>JSON.parse(db);
        }).catch(() => {
            return this.init();
        });
    }
    save = db => writeFile(dbLocation, JSON.stringify(db));
    generateCardId = name => name.toLowerCase().replace(/[ |,|`|.|']*/g, "");

    private init() {
        let initialDB = {
            decks: {

            },
            cards: {

            },
            availability: { },
            cardTypes: {
                free: 0,
                common: 40,
                rare: 100,
                epic: 400,
                legendary: 1600
            }
        } as DB;

        return writeFile(dbLocation, JSON.stringify(initialDB)).then(() => {
            return initialDB;
        });
    }
}

export default new DbUtils();

export interface DB {
    decks: { [index: string]: DBDeck };
    cards: { [index: string]: DBCard };
    availability: { [userId: string]: { [cardId: string]: number } };
    cardTypes: {
        free: number;
        common: number;
        rare: number;
        epic: number;
        legendary: number;
    };
}
export interface DBDeck {
    name: string;
    url: string;
    cost: number;
    costApprox: boolean;
    cards: { [index: string]: number };
}

export interface DBCard {
    id: string;
    name: string;
    description: string;
    flavorText: string;
    img: string;
    class: string;
    type: string;
    rarity: string;
    set: string;
    race: string;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
}