"use strict";
var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var writeFile = Promise.promisify(fs.writeFile), readFile = Promise.promisify(fs.readFile), dbLocation = path.join(__dirname, "db.json");
var DbUtils = (function () {
    function DbUtils() {
        this.save = function (db) { return writeFile(dbLocation, JSON.stringify(db)); };
        this.generateCardId = function (name) { return name.toLowerCase().replace(/[ |,|`|.|']*/g, ""); };
    }
    DbUtils.prototype.get = function () {
        var _this = this;
        return readFile(dbLocation, "utf8").then(function (db) {
            return JSON.parse(db);
        }).catch(function () {
            return _this.init();
        });
    };
    DbUtils.prototype.init = function () {
        var initialDB = {
            decks: {},
            cards: {},
            cardTypes: {
                free: 0,
                common: 40,
                rare: 100,
                epic: 400,
                legendary: 1600
            }
        };
        return writeFile(dbLocation, JSON.stringify(initialDB)).then(function () {
            return initialDB;
        });
    };
    return DbUtils;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new DbUtils();
//# sourceMappingURL=index.js.map