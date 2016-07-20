"use strict";
let fs = require("fs"),
    Promise = require("bluebird"),
    writeFile = Promise.promisify(fs.writeFile),
    readFile = Promise.promisify(fs.readFile),
    dbLocation = "./db/db.json";


module.exports = {
    get: () => {
        return readFile(dbLocation, "utf8").then(db => {
            return JSON.parse(db);
        }).catch(() => {
            return init();
        });
    },
    save: db => writeFile(dbLocation, JSON.stringify(db)),
    generateCardId: name => name.toLowerCase().replace(/[ |,|`|.|']*/g, ""),

};

function init() {
    let initialDB = {
        decks: {

        },
        cards: {

        },
        cardTypes: {
            free: 0,
            common: 40,
            rare: 100,
            epic: 400,
            legendary: 1600
        }
    };

    return writeFile(dbLocation, JSON.stringify(initialDB)).then(() => {
        return initialDB;
    });
}

