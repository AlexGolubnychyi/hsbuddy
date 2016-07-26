"use strict";
var errors = require("../error");
function url(req, res, next) {
    if (req.user) {
        return next();
    }
    res.redirect("/login");
}
exports.url = url;
function api(req, res, next) {
    if (!req.user) {
        next(new errors.UnAuthorizedError());
    }
    next();
}
exports.api = api;
//# sourceMappingURL=authChecks.js.map