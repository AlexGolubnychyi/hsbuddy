import { getContent } from "../lib/request";
import { BaseDeckParser, DeckData } from "./base/baseDeckParser";

class HearthStoneTopDecksParser extends BaseDeckParser {
    deckRegex = /hearthstonetopdecks\.com\/decks\/([0-9a-z\-]+)/;
    name = "HSTopDecks";
    canParse(url: string) {
        return this.deckRegex.test(url);
    };

    protected getDeckData(url: string) {
        return this.parseDeck(url).then(item => [item]);
    }


    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".entry-title").text().trim(),
                cards: { [cardName: string]: number } = {},
                dateBase = $(".entry-title").text().match(/\((.+),.*\)/),
                date: Date = new Date(NaN);

            if (dateBase) {
                date = new Date(dateBase[1]);
                date.setDate(15); //we get only month and year => improvise!
            }

            date = (isNaN(date.valueOf()) || date > new Date()) ? new Date() : date; //but not too much

            $(".deck-class").find(".card-frame").each((_: number, cardEl: CheerioElement) => {
                let $cardEl = $(cardEl),
                    cardName = $cardEl.find(".card-name").text().trim(),
                    count = +$cardEl.find(".card-count").text().trim();

                cards[cardName] = count;
            });

            return <DeckData>{ name, url, cards, date };
        });
    }
}

export default new HearthStoneTopDecksParser();
