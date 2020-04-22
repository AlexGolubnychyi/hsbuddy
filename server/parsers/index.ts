'use strict';
import * as Promise from 'bluebird';
import metaBombParser from './metaBombParser';
import { ParseStatus } from '../../interfaces';

import hearthpwnParser from './hearthPwnParser';
import manaCrystalsParser from './manaCrystalsParser';
import hearthstoneTopDecksParser from './hearthstoneTopDecksParser';
import tempoStormParser from './tempoStormParser';
import failParser from './failParser';
import { BaseDeckParser } from './base/baseDeckParser';
import { deckImportCodeParser } from './deckImportCodeParser';
import { metaStatsParser } from './metastatsParser';
import { hsReplayParser } from './hsReplayParser';
import { parseCards } from './cardParse';
import { vsParser } from './vsParser';



class Parser {
    private parsers: BaseDeckParser[];

    constructor() {
        this.parsers = [
            hearthpwnParser,
            manaCrystalsParser,
            hearthstoneTopDecksParser,
            metaBombParser,
            tempoStormParser,
            metaStatsParser,
            hsReplayParser,
            vsParser,
            // <-----deckCodeParser should always be at the botto, before failParser
            deckImportCodeParser,
            // <-----failParser should always be the last in the list
            failParser
        ];
    }

    parse(userId: string, urls: string[]) {
        const tasks = urls
            .map(url => this.parsers.find(p => p.canParse(url)).parse(userId, url));

        return Promise
            .all(tasks)
            .then(reports => reports.reduce((f, s) => f.concat(s)))
            .catch(e => [<ParseReportItem>{ status: ParseStatus.fail, url: '', reason: e.message }]);
    }

    parseUpgrade(userId: string, url: string, upgradeDeckId: string) {
        const parser = this.parsers.find(p => p.canParse(url));

        return parser
            .parse(userId, url, upgradeDeckId)
            .catch(e => [<ParseReportItem>{ status: ParseStatus.fail, url: '', reason: e.message }]);
    }

    populateWithCards() {
        console.log('[start] populate db with cards');
        return parseCards()
            .then(() => console.log('[done] populate db with cards'));
    }

}

export default new Parser();

export interface ParseReport {
    [index: number]: ParseReportItem;
}

export interface ParseReportItem {
    parserName: string;
    status: ParseStatus;
    reason?: string;
    url: string;
    id?: string;
}

export class ParseError extends Error {
    name = 'ParseError';

    constructor(public parseReportItem: ParseReportItem) {
        super(parseReportItem.reason);
        Error.captureStackTrace(this, ParseError);
    }

    getParseStatusReportItem() {
        return this.parseReportItem;
    }
}

