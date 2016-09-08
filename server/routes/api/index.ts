
import * as express from "express";
import parserRouter from "./parse";
import deckRouter from "./deck";
import cardRouter from "./card";

export default function (app: express.Express) {
  app.use("api/deck", deckRouter);
  app.use("api/card", cardRouter);
  app.use("api/parse", parserRouter);
};