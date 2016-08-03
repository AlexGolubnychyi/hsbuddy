import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

class ManaCrystalsParser extends BaseDeckParser {
    private deckRegex = /manacrystals\.com\/deck_guides\/([0-9]+)/;

    canParse(url: string) {
        return this.deckRegex.test(url);
    }
    parse(userId: string, url: string, save: boolean) {
        if (this.canParse(url)) {
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }

        return this.reportUnrecognized(url);
    }

    private parseDeck(userId: string, url: string, save: boolean) {
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
};

export default new ManaCrystalsParser();