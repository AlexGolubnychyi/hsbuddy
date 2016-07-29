
import * as express from "express";
//import * as authChecks from "../middleware/authChecks";
import apiRouter from "./api";
import parserRouter from "./parsers";
import loginRouter from "./login";

export default function (app: express.Express) {
  app.use("/", loginRouter);

  app.use("/api", apiRouter);
  app.use("/parse", parserRouter);
  app.use("/about", function (req, res) {
    res.render("about");
  });

  // app.use("/cards", authChecks.url, function (req, res) {
  //   res.render("index");
  // });

  app.use("/", function (req, res) {
    res.render("index");
  });

};

