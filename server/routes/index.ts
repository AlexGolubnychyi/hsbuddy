
import * as express from "express";
import loginRouter from "./login";
import setApiRoutes from "./api";

export default function (app: express.Express) {
  app.use("/", loginRouter);
  setApiRoutes(app);

  //default
  app.use("/", function (req, res) {
    res.render("index", { env: app.get("env") });
  });
};

