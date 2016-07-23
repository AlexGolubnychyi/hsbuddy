"use strict";
var express = require("express");
var session = require("express-session");
var path = require("path");
var body_parser_1 = require("body-parser");
var cookieParser = require("cookie-parser");
var routes_1 = require("./routes");
var lokiSessionStore_1 = require("./middleware/lokiSessionStore");
var logger = require("morgan");
// var favicon = require("serve-favicon");
var sessionStoreLocation = path.join(__dirname, "db/db-session.json"), app = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "../public")));
app.use("/client", express.static(path.join(__dirname, "../client")));
if (app.get("env") === "development") {
    app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));
}
app.use(body_parser_1.json());
app.use(body_parser_1.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "something else completely",
    store: lokiSessionStore_1.default(sessionStoreLocation, session),
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: (function () { var dt = new Date(); dt.setFullYear(dt.getFullYear() + 1); return dt; })()
    }
}));
//make user info accessible by jade engine
app.use(function (req, res, next) {
    req.user = res.locals.user = req.session["user"];
    next();
});
routes_1.default(app);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});
module.exports = app;
//# sourceMappingURL=app.js.map