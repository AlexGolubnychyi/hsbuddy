"use strict";
var loki = require("lokijs");
var fs = require("fs");
var Promise = require("bluebird");
var writeFile = Promise.promisify(fs.writeFile);
var LokiSessionStore = (function () {
    function LokiSessionStore(dbFileName) {
        var _this = this;
        this.on = function (evt, callback) {
            console.log(new Date(), "loki-session event: ", evt);
            if (callback) {
                callback.call(_this);
            }
        };
        this.get = function (sid, callback) {
            if (!_this.initialized) {
                callback(null);
                return;
            }
            var sess = _this._get(sid);
            callback(null, sess && sess.session);
        };
        this.set = function (sid, session, callback) {
            if (_this.initialized) {
                _this._remove(sid);
                _this.sessions.insert({
                    sid: sid,
                    session: session,
                    createdAt: new Date()
                });
            }
            callback(null);
        };
        this.destroy = function (sid, callback) {
            if (_this.initialized) {
                _this._remove(sid);
            }
            callback(null);
        };
        this.length = function (callback) {
            return (_this.sessions && _this.sessions.data) ? _this.sessions.data.length : 0;
        };
        this.clear = function (callback) {
            // TODO
        };
        this._remove = function (sid) {
            var entry = _this._get(sid);
            if (entry) {
                _this.sessions.remove(entry);
            }
        };
        this._get = function (sid) {
            return _this.sessions.by("sid", sid);
        };
        writeFile(dbFileName, "", { flag: "wx" }) //create if doesn't exist
            .catch(function () { console.log("session bd exists"); })
            .then(function () {
            var db = new loki(dbFileName, {
                autosave: true,
                autosaveInterval: 10000
            });
            db.loadDatabase({}, function () {
                _this.sessions = db.getCollection("Sessions");
                if (!_this.sessions) {
                    _this.sessions = db.addCollection("Sessions", {
                        unique: ["sid"]
                    });
                }
                _this.initialized = true;
            });
        });
    }
    LokiSessionStore.create = function (dbFileName, session) {
        //5am approach:
        return Object.assign(Object.create(session.Store.prototype), new LokiSessionStore(dbFileName));
    };
    return LokiSessionStore;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LokiSessionStore.create;
// mandatory
// .get(sid, callback)
// .set(sid, session, callback)
// .destroy(sid, callback)
// Recommended methods include, but are not limited to:
//
// .length(callback)
// .clear(callback)
//# sourceMappingURL=lokiSessionStore.js.map