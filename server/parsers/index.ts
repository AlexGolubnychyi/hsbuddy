"use strict";
import * as url from "url";
import * as Promise from "bluebird";
import cardParse from "./cardParse";
import metaBombParser from "./metaBombParser";

import hearthpwnParser from "./hearthPwnParser";
import manaCrystalsParser from "./manaCrystalsParser";
import hearthstoneTopDecksParser from "./hearthstoneTopDecksParser";
import tempoStormParser from "./tempoStormParser";
import {BaseDeckParser} from "./baseDeckParser";

class Parser {
    private parsers: { [index: string]: BaseDeckParser } = {};

    constructor() {
        [hearthpwnParser, manaCrystalsParser, hearthstoneTopDecksParser, metaBombParser, tempoStormParser]
            .forEach(p => this.parsers[p.siteName] = p);
    }

    parse(userId: string, urls: string[]) {
        let tasks = urls.map(this.urlToTask);

        return Promise.map(tasks, t => !t.parser
            ? Promise.resolve([{ status: ParseStatus.parserNotFound, url: t.url, reason: ""}])
            : t.parser.parse(userId, t.url, true))
            .then(reports => reports.reduce((f, s) => f.concat(s)));
    }

    private urlToTask = (urlString: string) => {
        let urlObj = url.parse(urlString);

        return {
            url: urlString,
            parser: this.parsers[urlObj.hostname]
        };
    }

    populateWithCards() {
        console.log("[start] populate db with cards");
        return cardParse()
            .then(() => console.log("[done] populate db with cards"));
    }
}

export default new Parser();

export interface ParseReport {
    [index: number]: ParseReportItem;
}

export interface ParseReportItem {
    status: ParseStatus;
    reason?: string;
    url: string;
}

export enum ParseStatus {
    success = 0, failed, duplicate, parserNotFound, urlNotRecognized, deckMalformed
}

export class ParseError extends Error {
    name = "ParseError";

    constructor(public message, public status: ParseStatus, public url: string) {
        super(message);
        Error.captureStackTrace(this, ParseError);
    }

    getParseStatusReportItem() {
        return <ParseReportItem>{ reason: this.message, status: this.status, url: this.url };
    }
}

