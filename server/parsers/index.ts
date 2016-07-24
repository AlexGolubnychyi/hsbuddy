"use strict";
import * as url from "url";
import * as Promise from "bluebird";
import cardParse from "./cardParse";
import metaBombParser from "./metaBombParser";

import hearthpwnParser from "./hearthpwnParser";
import manaCrystalsParser from "./manaCrystalsParser";
import hearthstoneTopDecksParser from "./hearthstoneTopDecksParser";
import {BaseDeckParser} from "./baseDeckParser";

class Parser {
    private parsers: { [index: string]: BaseDeckParser } = {};

    constructor() {
        [hearthpwnParser, manaCrystalsParser, hearthstoneTopDecksParser, metaBombParser]
            .forEach(p => this.parsers[p.siteName] = p);
    }

    parse(urls: string[]) {
        let tasks = urls
            .map(this.urlToTask)
            .filter(task => {
                if (!task.parser) {
                    console.log(`unable to find parser for ${task.url}`);
                    return false;
                }
                return true;
            });
        console.log("parse starting");

        return Promise.map(tasks, t => t.parser.parse(t.url, true))
            .then(() => console.log("parse complete"));
    }

    private urlToTask(urlString: string) {
        let urlObj = url.parse(urlString);

        return {
            url: urlString,
            parser: this.parsers[urlObj.hostname]
        };
    }

    temp() {
        cardParse()
            .then(() => metaBombParser.parseDeckList("http://hearthstone.metabomb.net/game-guides/the-best-standard-hearthstone-decks-july-2016-season-28", true))
            .then(() => console.log("done"));
    }
}

export default new Parser();