import * as Promise from "bluebird";
import {ParseReportItem} from "./index";
import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

class ManaCrystalsParser extends BaseDeckParser {
    siteName = "manacrystals.com";

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
            let name = $(".page-header").text().trim(),
                cards: { [cardName: string]: number } = {};


            $(".card-list-item").each((_, cardEl) => {
                let $cardEl = $(cardEl),
                    cardName = $cardEl.find(".card-name").text().trim(),
                    count = +$cardEl.find(".quantity").text().trim();

                cards[cardName] = count;
            });

            return this.addDeckUnsafe(userId, name, url, cards);
        });
    }

    parse(userId: string, url: string, save: boolean) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }

        return this.parseDeckList(userId, url, save);
    }

    private isDeckUrl(url) {
        return /manacrystals\.com\/deck_guides\/[0-9]*/.test(url);
    }
};

export default new ManaCrystalsParser();