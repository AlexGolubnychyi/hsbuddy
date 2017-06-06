import { getContent } from "../lib/request";
import { BaseDeckParser, DeckData } from "./base/baseDeckParser";

//TODO change to regex
let keywords = { deckUrl: "/deck-guides/", deckListUrl: "game-guides" };


class MetaBombParser extends BaseDeckParser {
    private deckRegex = /hearthstone\.metabomb.net\/deck-guides\/([0-9a-zA-Z\-]+)/;
    private deckListRegex = /hearthstone\.metabomb.net\/game-guides\/([0-9a-zA-Z\-]+)/;

    canParse(url: string) {
        return this.deckRegex.test(url) || this.deckListRegex.test(url);
    }

    protected getDeckData(url: string) {
        if (this.deckListRegex.test(url)) {
            return this.parseDeckList(url);
        }

        return this.parseDeck(url).then(reportItem => [reportItem]);
    }

    private parseDeckList(url: string) {
        console.log(`parsing ${url}`);
        return getContent(url)
            .then($ => {
                let unique = {};
                $(`[href*='${keywords.deckUrl}']`).each((inx: number, el: CheerioElement) => unique[($(el) as any).prop("href")] = true);
                return Object.keys(unique);
            })
            .map((deckUrl: string) => this.parseDeck(deckUrl), { concurrency: 2 });
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $("h1.title").text(),
                cards: { [cardName: string]: number } = {},
                date = new Date($("span[itemprop=datePublished]").attr("content"));

            $("main table").first().find("tr").each((_: number, tr: CheerioElement) => {
                $(tr).find("td").each((inx: number, td: CheerioElement) => {
                    let text = $(td).text();
                    if (!text) {
                        return;
                    }
                    let [, count, cardName] = text.match(/(1|2)\s*x\s*(.+)/);
                    cards[cardName] = +count;
                });
            });

            return <DeckData>{ name, url, cards, date };
        });
    }
};

export default new MetaBombParser();
