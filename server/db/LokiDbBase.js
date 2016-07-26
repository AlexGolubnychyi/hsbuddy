"use strict";
var Promise = require("bluebird");
var loki = require("lokijs");
var fs = require("fs");
var writeFile = Promise.promisify(fs.writeFile);
var LokiDbBase = (function () {
    function LokiDbBase(dbLocation) {
        this.dbLocation = dbLocation;
        this.initialized = false;
    }
    LokiDbBase.prototype.ensureDb = function () {
        var _this = this;
        if (this.initialized) {
            return Promise.resolve(this.db);
        }
        return this.init().then(function () { return _this.db; });
    };
    LokiDbBase.prototype.saveDb = function () {
        if (!this.initialized) {
            return Promise.reject("db is not initialized");
        }
        return this._saveDb();
    };
    LokiDbBase.prototype.getCollection = function (name) {
        this.doInitCheck();
        return this.db.getCollection(name);
    };
    LokiDbBase.prototype.init = function () {
        var _this = this;
        this.db = new loki(this.dbLocation);
        this._loadDb = Promise.promisify(this.db.loadDatabase.bind(this.db));
        this._saveDb = Promise.promisify(this.db.saveDatabase.bind(this.db));
        return writeFile(this.dbLocation, "", { flag: "wx" })
            .catch(function () { return console.log("db exists"); })
            .then(function () { return _this._loadDb({}); })
            .then(function () {
            var thenable = _this.inflate(_this.db);
            if (thenable) {
                return thenable
                    .then(function () { return _this.initialized = true; })
                    .then(function () { return _this._saveDb(); });
            }
            _this.initialized = true;
            return _this._saveDb();
        });
    };
    LokiDbBase.prototype.doInitCheck = function () {
        if (!this.initialized) {
            throw "db is not inilialized";
        }
    };
    return LokiDbBase;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LokiDbBase;
//# sourceMappingURL=LokiDbBase.js.map