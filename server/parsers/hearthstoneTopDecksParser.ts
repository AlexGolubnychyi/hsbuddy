import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

class HearthStoneTopDecksParser extends BaseDeckParser {
    deckRegex = /hearthstonetopdecks\.com\/decks\/([0-9a-z\-]+)/;

    parse(userId: string, url: string, save: boolean) {
        if (this.canParse(url)) {
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }

        return this.reportUnrecognized(url);
    }

    canParse(url: string) {
        return this.deckRegex.test(url);
    }

    private parseDeck(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".entry-title").text().trim(),
                cards: { [cardName: string]: number } = {},
                date = new Date($(".entry-title").text().match(/\((.+),.*\)/)[1]);
            date.setDate(15); //we get only month and year => improvise!
            date = (isNaN(date.valueOf()) || date > new Date()) ? new Date() : date; //but not too much


            $(".deck-class").find(".card-frame").each((_, cardEl) => {
                let $cardEl = $(cardEl),
                    cardName = $cardEl.find(".card-name").text().trim(),
                    count = +$cardEl.find(".card-count").text().trim();

                cards[cardName] = count;
            });

            return this.addDeckUnsafe(userId, name, url, cards);
        });
    }
}

export default new HearthStoneTopDecksParser();