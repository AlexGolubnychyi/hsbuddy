"use strict";
import * as express from "express";
import hearthpwnParse from "../parsers/hearthpwn";
import icyveinsParse from "../parsers/icyveins";
import metabombParse from "../parsers/metabomb";


let router = express.Router();


router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    hearthpwnParse()
        .then(() => res.write("<p>hearthpwn done<p>"))
        .then(() => icyveinsParse())
        .then(() => res.write("<p>icyveins done<p>"))
        .then(() => metabombParse())
        .then(() => res.write("<p>metabomb done<p>"))
        .then(() => res.write("<h1>All Done!!!<h1>"))
        .catch(e => res.write("internal error"))
        .finally(() => res.end());
});


export default router;