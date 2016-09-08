
import * as express from "express";

import deckRouter from "./api/deck";
import cardRouter from "./api/card";
import loginRouter from "./login";
import parserRouter from "./api/parse";

export default function (app: express.Express) {
  app.use("/", loginRouter);

  app.use("/api/deck", deckRouter);
  app.use("/api/card", cardRouter);
  app.use("/api/parse", parserRouter);

  //default
  app.use("/", function (req, res) {
    res.render("index", { env: app.get("env") });
  });
};

