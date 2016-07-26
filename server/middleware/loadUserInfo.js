"use strict";
var db_1 = require("../db");
function default_1(req, res, next) {
    var userId = req.session["user"];
    db_1.default.ensureDb()
        .then(function () {
        var user = db_1.default.getCollection(db_1.default.collections.user).by("userId", userId);
        if (user) {
            req.user = res.locals.user = userId;
        }
        next();
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
//# sourceMappingURL=loadUserInfo.js.map