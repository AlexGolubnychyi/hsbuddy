
import * as express from "express";
import deckRouter from "./decks";
import cardRouter from "./cards";
import parserRouter from "./parsers";
import loginRouter from "./login";

export default function (app: express.Express) {
  app.use("/decks", deckRouter);
  app.use("/cards", cardRouter);
  app.use("/parse", parserRouter);
  app.use("/", loginRouter);

  //landing
  let mainRouter = express.Router();
  mainRouter.get("/", function (req, res) {
    res.render("index");
  });

  mainRouter.get("/about", function (req, res) {
    res.render("about");
  });

  app.use("/", mainRouter);
};

