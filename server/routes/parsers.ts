"use strict";
import * as Promise from "bluebird";
import * as express from "express";
import * as authChecks from "../middleware/authChecks";
import parser, { ParseStatus } from "../parsers";
import * as contracts from "../../interfaces";

let router = express.Router();

router.post("/", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let links = (req.body.links as string).replace(/[\n|\r]+/g, "|").split("|");

    // Promise
    //     .each(links.map(link => parser.parse(req.user, [link])), reports => {
    //         reports.forEach(report => {
    //             res.write(`<div>[${ParseStatus[report.status]}] ${report.url}. ${report.reason || ""}</div>`);
    //         });
    //     })
    //     .then(() => res.write(`
    //             <h2>All Done!</h2> 
    //             <div><a href="/">Go to main</a></div>
    //             <div><a href="/parse">Go to parse</a></div>`))
    //     .then(() => res.end());
    let promises = links.map(link => parser.parse(req.user, [link]));
    Promise.all(promises).then(reports => {
        let results = reports.reduce((acc, rez) => acc = acc.concat(rez), []).map(rez => <contracts.ParseResult>{
            url: rez.url,
            status: rez.status === ParseStatus.success
                ? contracts.ParseStatus.success
                : rez.status === ParseStatus.duplicate
                    ? contracts.ParseStatus.duplicate
                    : contracts.ParseStatus.fail,
            error: rez.status !== ParseStatus.success && rez.status !== ParseStatus.duplicate
                ? ParseStatus[rez.status] + (rez.reason && ` ${rez.reason}` || "")
                : ""
        });

        res.json(results);
        return null;
    });

});

export default router;