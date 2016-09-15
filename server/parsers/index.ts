"use strict";
import * as Promise from "bluebird";
import cardParse from "./cardParse";
import metaBombParser from "./metaBombParser";
import {ParseStatus} from "../../interfaces";

import hearthpwnParser from "./hearthPwnParser";
import manaCrystalsParser from "./manaCrystalsParser";
import hearthstoneTopDecksParser from "./hearthstoneTopDecksParser";
import tempoStormParser from "./tempoStormParser";
import failParser from "./failParser";
import {BaseDeckParser} from "./baseDeckParser";


class Parser {
    private parsers: BaseDeckParser[];

    constructor() {
        this.parsers = [
            hearthpwnParser,
            manaCrystalsParser,
            hearthstoneTopDecksParser,
            metaBombParser,
            tempoStormParser,
            //<-----failParser should always be the last in the list
            failParser
        ];
    }

    parse(userId: string, urls: string[]) {
        let tasks = urls
            .map(this.urlClean)
            .map(url => this.parsers.find(p => p.canParse(url)).parse(userId, url, true)) as PromiseLike<ParseReportItem[]>[];

        return Promise.all(tasks)
            .then(reports => reports.reduce((f, s) => f.concat(s)))
            .catch(e => [<ParseReportItem>{ status: ParseStatus.fail, url: "", reason: e.message }]);
    }

    populateWithCards() {
        console.log("[start] populate db with cards");
        return cardParse()
            .then(() => console.log("[done] populate db with cards"));
    }

    private urlClean(url: string) {
        let prefix = "http://";
        if (!/https?:\/\//.test(url)) {
            return prefix + url;
        }
        return url;
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
    id?: string;
}

export class ParseError extends Error {
    name = "ParseError";

    constructor(public message, public status: ParseStatus, public url: string, public deckId?: string) {
        super(message);
        Error.captureStackTrace(this, ParseError);
    }

    getParseStatusReportItem() {
        return <ParseReportItem>{ reason: this.message, status: this.status, url: this.url, id: this.deckId };
    }
}

