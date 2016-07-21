
import * as express from "express";
import deckRouter from "./decks";

let router = express.Router();

export default function(app) {
  app.use("/decks", deckRouter);

  router.get("/", function (req, res) {
    res.redirect("/decks");
  });

  app.use("/", router);
};

