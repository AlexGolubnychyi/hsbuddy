"use strict";
function default_1(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
//# sourceMappingURL=checkAuth.js.map