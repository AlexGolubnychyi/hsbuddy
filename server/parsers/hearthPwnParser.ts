import * as Promise from "bluebird";
import getContent from "./utils";
import {ParseReportItem} from "./index";
import {BaseDeckParser} from "./baseDeckParser";

class HearthPwnParser extends BaseDeckParser {
    siteName = "www.hearthpwn.com";

    parseDeckList(userId: string, url: string, save: boolean): Promise<ParseReportItem[]> {
        return <any>Promise.reject("not implemented");
        // console.log(`parsing ${url}`);
        // return dbUtils.ensureDb()
        //     .then(() => getContent(url))
        //     .then($ => {
        //         let unique = {};
        //         $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
        //         return Object.keys(unique);
        //     })
        //     .map((deckUrl: string) => this.parseDeck(deckUrl, false), { concurrency: 2 })
        //     .then(() => {
        //         if (save) {
        //             return dbUtils.saveDb();
        //         }
        //     });
    }

    parseDeck(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".deck-title").text(),
                cards: { [cardName: string]: number } = {};


            $(".class-listing .listing, .neutral-listing .listing").find("[data-id]").each((_, cardEl) => {
                let $td = $(cardEl).closest("td"),
                    info = $td.closest("td").text().trim().split("×"),
                    cardName = info[0].trim(),
                    count = +info[1].trim();
                cards[cardName] = count;
            });

            return this.addDeckUnsafe(userId, name, url, cards);
        });
    }

    parse(userId: string, url: string, save: boolean) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(userId, url, save).then(item => [item]);
        }
        return this.parseDeckList(userId, url, save);
    }

    private isDeckUrl(url) {
        return /hearthpwn\.com\/decks\/[0-9]*/.test(url);
    }
};

export default new HearthPwnParser();