import * as errors from "../error";

export function url(req, res, next) {
    if (req.user) {
        return next();
    }
    res.redirect("/login");
}

export  function api(req, res, next) {
    if (!req.user) {
        next(new errors.UnAuthorizedError());
    }
    next();
}

