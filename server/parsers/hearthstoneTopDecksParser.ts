import * as Promise from "bluebird";
import {ParseReportItem} from "./index";
import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

class HearthStoneTopDecksParser extends BaseDeckParser {
    siteName = "www.hearthstonetopdecks.com";

    parseDeckList(url: string, save: boolean):Promise<ParseReportItem[]> {
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

    parseDeck(url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".entry-title").text().trim(),
                cards: { [cardName: string]: number } = {};


            $(".deck-class").find(".card-frame").each((_, cardEl) => {
                let $cardEl = $(cardEl),
                    cardName = $cardEl.find(".card-name").text().trim(),
                    count = +$cardEl.find(".card-count").text().trim();

                cards[cardName] = count;
            });

            return this.addDeckUnsafe(name, url, cards);
        });
    }

    parse(url: string, save: boolean) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(url, save).then(reportItem => [reportItem]);
        }

        return this.parseDeckList(url, save);
    }

    private isDeckUrl(url) {
        return /www\.hearthstonetopdecks\.com\/decks/.test(url);
    }
}

export default new HearthStoneTopDecksParser();