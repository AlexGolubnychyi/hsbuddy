'use strict';
import * as Promise from 'bluebird';
import * as express from 'express';
import * as authChecks from '../middleware/authChecks';
import parser from '../parsers';
import * as contracts from '../../interfaces';
import { Request } from './index';

export const parseRouter = express.Router();

parseRouter.post('/', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    const links = (req.body.links as string).replace(/[\n|\r]+/g, '|').split('|').filter(l => !!l && l[0] !== '#'),
        promises = links.map(link => parser.parse(req.user, [link]));
    Promise.all(promises).then(reports => {
        const results = reports.reduce((acc, rez) => acc = acc.concat(rez), []).map(rez => <contracts.ParseResult>{
            deckId: rez.id,
            url: rez.url,
            status: rez.status,
            parserName: rez.parserName,
            error: rez.status === contracts.ParseStatus.fail
                ? rez.reason || ''
                : ''
        });

        res.json(results);
        return null;
    });
});

parseRouter.post('/upgrade', authChecks.api, (req: Request, res: express.Response, next: express.NextFunction) => {
    const deckId: string = req.body.deckId,
        url: string = req.body.url;

    parser.parseUpgrade(req.user, url, deckId).then(reports => {
        const report = reports[0];

        res.json(<contracts.ParseResult>{
            deckId: report.id,
            url: report.url,
            status: report.status,
            error: report.status === contracts.ParseStatus.fail
                ? report.reason || ''
                : ''
        });
        return null;
    });

});
