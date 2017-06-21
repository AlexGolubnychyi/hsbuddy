import { DeckData, BaseDeckParser } from "./base/baseDeckParser";
import { getContent } from "../lib/request";
import { deckEncoder } from "../db/utils/deckEncoder";



class MetaStatsParser extends BaseDeckParser {
    private deckRegex = /metastats\.net\/deck\/([0-9a-zA-Z\-\/]+)/;

    canParse(url: string) {
        return this.deckRegex.test(url);
    };

    protected getDeckData(url: string) {
        return this.parseDeck(url).then(item => [item]);
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".decklist h4").text().trim(),
                date = new Date(),
                [, importCode] = $(".copytoclipboard").attr("data-clipboard-text").split("\n");

            return deckEncoder
                .decode(importCode)
                .then(cards => <DeckData>{ name, url, cards, date });
        });
    }
};

export const metaStatsParser = new MetaStatsParser();
