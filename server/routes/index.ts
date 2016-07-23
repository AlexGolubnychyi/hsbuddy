
import * as express from "express";
import deckRouter from "./decks";
import parserRouter from "./parsers";
import loginRouter from "./login";

export default function (app: express.Express) {
  app.use("/decks", deckRouter);
  app.use("/parse", parserRouter);
  app.use("/", loginRouter);

  //landing
  let mainRouter = express.Router();
  mainRouter.get("/", function (req, res) {
    res.render("index");
  });
  app.use("/", mainRouter);
};

