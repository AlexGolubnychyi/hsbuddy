import * as Promise from "bluebird";
import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";
import {ParseReportItem, ParseStatus} from "./index";

//TODO change to regex
let keywords = { deckUrl: "/deck-guides/", deckListUrl: "game-guides" };


class MetaBombParser extends BaseDeckParser {
    siteName = "hearthstone.metabomb.net";

    parseDeckList(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);
        return getContent(url)
            .then($ => {
                let unique = {};
                $(`[href*='${keywords.deckUrl}']`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
                return Object.keys(unique);
            })
            .map((deckUrl: string) => this.parseDeck(userId, deckUrl, false), { concurrency: 2 });
    }

    parseDeck(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $("main>article>header>h1").text(),
                cards: { [cardName: string]: number } = {};

            $("main table").first().find("tr").each((_, tr) => {
                $(tr).find("td").each((inx, td) => {
                    let text = $(td).text();
                    if (!text) {
                        return;
                    }
                    let [count, cardName] = text.split(" x ").map(part => part.trim());
                    cards[cardName] = +count;
                });
            });

            return this.addDeckUnsafe(userId, name, url, cards);
        });
    }

    parse(userId: string, url: string, save: boolean) {
        if (url.indexOf(keywords.deckListUrl) > 0) {
            return this.parseDeckList(userId, url, save);
        }
        if (url.indexOf(keywords.deckUrl) > 0) { //change to regex url check
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }

        return Promise.resolve([<ParseReportItem>{ status: ParseStatus.urlNotRecognized, url: url }]);
    }
};

export default new MetaBombParser();