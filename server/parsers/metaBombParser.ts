import * as Promise from "bluebird";
import dbUtils from "../db";
import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";
let keywords = { deckUrl: "deck-list", deckListUrl: "game-guides" };


class MetaBombParser extends BaseDeckParser {
    siteName = "hearthstone.metabomb.net";

    parseDeckList(url: string, save: boolean) {
        console.log(`parsing ${url}`);
        return dbUtils.ensureDb()
            .then(() => getContent(url))
            .then($ => {
                let unique = {};
                $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
                return Object.keys(unique);
            })
            .map((deckUrl: string) => this.parseDeck(deckUrl, false), { concurrency: 2 })
            .then(reports => {
                if (save) {
                    return dbUtils.saveDb().then(() => reports);
                }
                return reports;
            });
    }

    parseDeck(url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name =  $("main>article>header>h1").text(),
                cards: { [cardName: string]: number } = {};

            $("main table").first().find("tr").each((_, tr) => {
                $(tr).find("td").each((inx, td) => {
                    let $el = $(td).find("span[data-card]");
                    if (!$el.length) {
                        return;
                    }

                    let cardName = $el.first().text().trim(),
                        count = +$el.parent().contents().first().text()[0];

                    cards[cardName] = count;
                });
            });
            let [deck, reportItem] = this.addDeckUnsafe(name, url, cards);

            if (save && deck) {
                return dbUtils.saveDb().then(() => reportItem);
            }

            return reportItem;
        });
    }

    parse(url: string, save: boolean) {
        if (url.indexOf(keywords.deckListUrl) > 0) {
            return this.parseDeckList(url, save);
        }
        if (url.indexOf(keywords.deckUrl) > 0) {
            return this.parseDeck(url, save).then(reportItem => [reportItem]);
        }

        Promise.reject(`metabomb parser: unknown url: ${url}`);
    }
};

export default new MetaBombParser();