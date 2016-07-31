"use strict";
import * as Promise  from "bluebird";
import * as express from "express";
import * as authChecks from "../middleware/authChecks";
import parser, {ParseStatus} from "../parsers";

let router = express.Router();


router.get("/", authChecks.url, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.render("parser");
});

router.post("/", authChecks.api, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let links = (req.body.links as string).replace(/[\n|\r]+/g, "|").split("|");

     res.write("<p>working, please wait..</p>");

    Promise
        .each(links.map(link => parser.parse(req.user, [link])), reports => {
            reports.forEach(report => {
                res.write(`<div>[${ParseStatus[report.status]}] ${report.url}. ${report.reason || ""}</div>`);
            });
        })
        .then(() => res.write(`
                <h2>All Done!</h2> 
                <div><a href="/">Go to main</a></div>
                <div><a href="/parse">Go to parse</a></div>`))
        .then(() => res.end());

});




export default router;