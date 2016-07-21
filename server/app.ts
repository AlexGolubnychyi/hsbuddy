"use strict";

import * as express from "express";
import * as path from "path";
import {json, urlencoded} from "body-parser";

import setRoutes from "./routes";
// var favicon = require("serve-favicon");
var logger = require("morgan");
// var cookieParser = require("cookie-parser");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
// app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../public")));
app.use("/client", express.static(path.join(__dirname, "../client")));
if (app.get("env") === "development") {
  app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));
}

setRoutes(app);

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
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
