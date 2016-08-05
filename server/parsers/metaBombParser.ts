import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

//TODO change to regex
let keywords = { deckUrl: "/deck-guides/", deckListUrl: "game-guides" };


class MetaBombParser extends BaseDeckParser {
    private deckRegex = /hearthstone\.metabomb.net\/deck-guides\/([0-9a-zA-Z\-]+)/;
    private deckListRegex = /hearthstone\.metabomb.net\/game-guides\/([0-9a-zA-Z\-]+)/;

    canParse(url: string) {
        return this.deckRegex.test(url) || this.deckListRegex.test(url);
    }
    parse(userId: string, url: string, save: boolean) {
        if (this.deckListRegex.test(url)) {
            return this.parseDeckList(userId, url, save);
        }

        if (this.deckRegex.test(url)) {
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }

        return this.reportUnrecognized(url);
    }

    private parseDeckList(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);
        return getContent(url)
            .then($ => {
                let unique = {};
                $(`[href*='${keywords.deckUrl}']`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
                return Object.keys(unique);
            })
            .map((deckUrl: string) => this.parseDeck(userId, deckUrl, false), { concurrency: 2 });
    }

    private parseDeck(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $("main>article>header>h1").text(),
                cards: { [cardName: string]: number } = {},
                date = new Date($("span[itemprop=datePublished]").attr("content"));

            $("main table").first().find("tr").each((_, tr) => {
                $(tr).find("td").each((inx, td) => {
                    let text = $(td).text();
                    if (!text) {
                        return;
                    }
                    let [_, count, cardName] = text.match(/(1|2)\s*x\s*(.+)/);
                    cards[cardName] = +count;
                });
            });

            return this.addDeckUnsafe(userId, name, url, cards, date);
        });
    }
};

export default new MetaBombParser();