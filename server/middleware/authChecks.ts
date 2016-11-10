import * as errors from "../error";
import {Request, Response, NextFunction}  from "express";

export function url(req: Request & {user?: any}, res: Response, next: NextFunction) {
    if (req.user) {
        return next();
    }
    res.redirect("/login");
}

export  function api(req: Request & {user?: any}, res: Response, next: NextFunction) {
    if (!req.user) {
        next(new errors.UnAuthorizedError());
    }
    next();
}

