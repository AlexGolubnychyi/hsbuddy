"use strict";

let express = require("express"),
  router = express.Router();

module.exports = function (app) {
  app.use("/decks", require("./decks.js"));

  router.get("/", function (req, res) {
    res.redirect("/decks");
  });

  app.use("/", router);
};

