"use strict";

import * as express from "express";
import * as path from "path";
import {json, urlencoded} from "body-parser";
import setRoutes from "./routes";
import lokiSessionStoreFactory from "./middleware/lokiSessionStore";
//import passport

// var favicon = require("serve-favicon");
var logger = require("morgan"),
    cookieParser = require("cookie-parser"),
    session = require("express-session"),
    sessionStoreLocation = path.join(__dirname, "db/db-session.json");
// passport = require("passport"),
// LocalStrategy = require("passport-local").Strategy;

var app = express();

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

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: false }));

app.use(session({
    secret: "something else completely",
    store: lokiSessionStoreFactory(sessionStoreLocation, session),
    resave: false,
    saveUninitialized: false
}));
// app.use(passport.initialize());
// app.use(passport.session());


// //https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
// passport.use(new LocalStrategy(
//     function (username, password, done) {
//         // User.findOne({ username: username }, function(err, user) {
//         //   if (err) { return done(err); }
//         //   if (!user) {
//         //     return done(null, false, { message: 'Incorrect username.' });
//         //   }
//         //   if (!user.validPassword(password)) {
//         //     return done(null, false, { message: 'Incorrect password.' });
//         //   }
//         //   return done(null, user);
//         // });

//         if (username === "1" && password === "2") {
//             return done(null, "jess-1");
//         }

//         return done(null, false, { message: "Incorrect username or password" });
//     }
// ));

// app.post("/login", passport.authenticate("local", {
//     successRedirect: "/",
//     failureRedirect: "/login.html"
// }));

// passport.serializeUser(function (user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function (user, done) {
//     done(null, user);
// });

//make user info accessible by jade engine
app.use((req, res, next) => {
    req.user = res.locals.user = req.session["user"];
    next();
});
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


module.exports = app;
