"use strict";
import * as Promise from "bluebird";
import * as express from "express";
import * as authChecks from "../../middleware/authChecks";
import parser from "../../parsers";
import * as contracts from "../../../interfaces";
import { Request } from "../index";
let router = express.Router();

router.post("/", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    let links = (req.body.links as string).replace(/[\n|\r]+/g, "|").split("|").filter(l => l[0] !== "#");

    let promises = links.map(link => parser.parse(req.user, [link]));
    Promise.all(promises).then(reports => {
        let results = reports.reduce((acc, rez) => acc = acc.concat(rez), []).map(rez => <contracts.ParseResult>{
            deckId: rez.id,
            url: rez.url,
            status: rez.status,
            error: rez.status === contracts.ParseStatus.fail
                ? rez.reason || ""
                : ""
        });

        res.json(results);
        return null;
    });
});

router.post("/upgrade", authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    let deckId: string = req.body.deckId,
        url: string = req.body.url;

    parser.parseUpgrade(req.user, url, deckId).then(reports => {
        let report = reports[0];

        res.json(<contracts.ParseResult>{
            deckId: report.id,
            url: report.url,
            status: report.status,
            error: report.status === contracts.ParseStatus.fail
                ? report.reason || ""
                : ""
        });
        return null;
    });

});

export default router;
