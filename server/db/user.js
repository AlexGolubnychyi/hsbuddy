"use strict";
var index_1 = require("./index");
var crypto = require("crypto");
var error_1 = require("../error");
var UserUtils = (function () {
    function UserUtils() {
    }
    UserUtils.prototype.auth = function (userId, password) {
        var _this = this;
        return index_1.default.ensureDb().then(function (db) {
            var user = db.getCollection(index_1.default.collections.user).by("userId", userId);
            if (!user || _this.encrypt(password) !== user.hash) {
                return Promise.reject(new error_1.AuthError("invalid username or password"));
            }
        });
    };
    UserUtils.prototype.createUser = function (userId, password) {
        var _this = this;
        userId = userId && userId.trim();
        password = password && password.trim();
        if (!userId || !password) {
            return Promise.reject(new error_1.AuthError("Cannot create user: name/password cannot be empty"));
        }
        return index_1.default.ensureDb().then(function (db) {
            var users = db.getCollection(index_1.default.collections.user);
            var user = users.by("userId", userId);
            if (user) {
                return Promise.reject(new error_1.AuthError("Cannot create user: user already exists"));
            }
            user = {
                userId: userId,
                hash: _this.encrypt(password)
            };
            users.insert(user);
        }).then(function () { return index_1.default.saveDb(); });
    };
    UserUtils.prototype.encrypt = function (password) {
        return crypto.createHmac("sha1", UserUtils.salt).update(password).digest("hex");
    };
    UserUtils.salt = "everything is better with salt";
    return UserUtils;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new UserUtils();
//# sourceMappingURL=user.js.map