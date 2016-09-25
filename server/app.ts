"use strict";

import * as express from "express";
import * as session from "express-session";
import * as path from "path";
import { json, urlencoded } from "body-parser";
import * as cookieParser from "cookie-parser";
import setRoutes from "./routes";

import loadUserInfo from "./middleware/loadUserInfo";
import * as logger from "morgan";
//import * as connectMongo from "connect-mongo";
import mongoose from "./lib/mongoose";

let compression = require("compression"),
    less = require("less-middleware"),
    favicon = require("serve-favicon"),
    connectMongo = require("connect-mongo");


const app = express();
app.use(compression());
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");


app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));
app.use(logger("dev"));

//LESS
app.use(less(path.join(__dirname, "../public"), { once: true }));

//HTML url rewrite
app.use((req, res, next) => {
    if (req.url.endsWith("html")) {
        req.url = "/client/components" + req.url;
    }
    next();
});

//static
app.use(express.static(path.join(__dirname, "../public")));
app.use("/client", express.static(path.join(__dirname, "../client")));
app.use("/interfaces", express.static(path.join(__dirname, "../interfaces")));
app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));

//hack, remove when move to angular routing completely or creat routing sublevel
app.use((req, res, next) => {
    let fileRequest = [".js", ".html", ".ico", ".css"].some(ending => req.url.slice(-ending.length) === ending);
    if (fileRequest) {
        var err = new Error("Not Found") as any;
        err.status = 404;
        next(err);
        return;
    }
    next();
});

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "something else completely",
    name: "hs_sid",
    store: new (connectMongo(session))({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: (() => { let dt = new Date(); dt.setFullYear(dt.getFullYear() + 1); return dt; })()
    }
}));

//make user info accessible by jade engine
app.use(loadUserInfo);
setRoutes(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error("Not Found") as any;
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});


export default app;
