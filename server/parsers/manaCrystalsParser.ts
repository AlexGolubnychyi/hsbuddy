import { getContent } from "../lib/request";
import { BaseDeckParser, DeckData } from "./base/baseDeckParser";

class ManaCrystalsParser extends BaseDeckParser {
    private deckRegex = /manacrystals\.com\/deck_guides\/([0-9]+)/;
    name = "ManaCrystals";
    canParse(url: string) {
        return this.deckRegex.test(url);
    };

    protected getDeckData(url: string) {
        return this.parseDeck(url).then(item => [item]);
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".page-header").text().trim(),
                dateStr = $("section h4")
                    .filter((_: number, h4: CheerioElement) => $(h4).text().toLowerCase().trim() === "last updated")
                    .parent()
                    .find("p")
                    .text(),
                date = new Date(dateStr),
                cards: { [cardName: string]: number } = {};

            $(".card-list-item").each((_: number, cardEl: CheerioElement) => {
                let $cardEl = $(cardEl),
                    cardName = $cardEl.find(".card-name").text().trim(),
                    count = +$cardEl.find(".quantity").text().trim();

                cards[cardName] = count;
            });

            return <DeckData>{ name, url, cards, date };
        });
    }
};

export default new ManaCrystalsParser();
