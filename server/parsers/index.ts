"use strict";
import * as Promise from "bluebird";
import cardParse from "./cardParse";
import metaBombParser from "./metaBombParser";
import { ParseStatus } from "../../interfaces";

import hearthpwnParser from "./hearthPwnParser";
import manaCrystalsParser from "./manaCrystalsParser";
import hearthstoneTopDecksParser from "./hearthstoneTopDecksParser";
import tempoStormParser from "./tempoStormParser";
import failParser from "./failParser";
import { BaseDeckParser } from "./base/baseDeckParser";
import { deckImportCodeParser } from "./deckImportCodeParser";
import { metaStatsParser } from "./metastatsParser";



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
            //<-----deckCodeParser should always be at the botto, before failParser
            deckImportCodeParser,
            //<-----failParser should always be the last in the list
            failParser
        ];
    }

    parse(userId: string, urls: string[]) {
        let tasks = urls
            .map(url => this.parsers.find(p => p.canParse(url)).parse(userId, url));

        return Promise
            .all(tasks)
            .then(reports => reports.reduce((f, s) => f.concat(s)))
            .catch(e => [<ParseReportItem>{ status: ParseStatus.fail, url: "", reason: e.message }]);
    }

    parseUpgrade(userId: string, url: string, upgradeDeckId: string) {
        let parser = this.parsers.find(p => p.canParse(url));

        return parser
            .parse(userId, url, upgradeDeckId)
            .catch(e => [<ParseReportItem>{ status: ParseStatus.fail, url: "", reason: e.message }]);
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
    id?: string;
}

export class ParseError extends Error {
    name = "ParseError";

    constructor(public message: string, public status: ParseStatus, public url: string, public deckId?: string) {
        super(message);
        Error.captureStackTrace(this, ParseError);
    }

    getParseStatusReportItem() {
        return <ParseReportItem>{ reason: this.message, status: this.status, url: this.url, id: this.deckId };
    }
}

