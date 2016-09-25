"use strict";
import * as Promise from "bluebird";
import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import parser from "../../parsers";
import * as contracts from "../../../interfaces";
import {Request} from "../index";
let router = express.Router();

router.post("/", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    let links = (req.body.links as string).replace(/[\n|\r]+/g, "|").split("|");

    let promises = links.map(link => parser.parse(req.user, [link]));
    Promise.all(promises).then(reports => {
        let results = reports.reduce((acc, rez) => acc = acc.concat(rez), []).map(rez => <contracts.ParseResult>{
            deckId: rez.id,
            url: rez.url,
            status: rez.status,
            error: rez.status === contracts.ParseStatus.fail
                ? rez.reason && ` ${rez.reason}` || ""
                : ""
        });

        res.json(results);
        return null;
    });

});

export default router;