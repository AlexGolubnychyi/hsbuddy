"use strict";
import * as express from "express";
import * as authChecks from "../middleware/authChecks";
import parser from "../parsers";

let router = express.Router();

// router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     hearthpwnParse()
//         .then(() => res.write("<p>hearthpwn done<p>"))
//         .then(() => icyveinsParse())
//         .then(() => res.write("<p>icyveins done<p>"))
//         .then(() => metabombParse())
//         .then(() => res.write("<p>metabomb done<p>"))
//         .then(() => res.write("<h1>All Done!!!<h1>"))
//         .catch(e => res.write("internal error"))
//         .finally(() => res.end());
// });

router.get("/", authChecks.url, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.render("parser");
});

router.post("/", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let links = req.body.links.replace(/[\n|\r]+/g, "|").split("|");
    parser.temp();
    // parser.parse(links).then(() => {
    //     res.send("done!");
    // });
});




export default router;