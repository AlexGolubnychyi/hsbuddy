import { getContent } from "../lib/request";
import { BaseDeckParser, DeckData } from "./baseDeckParser";

class HearthPwnParser extends BaseDeckParser {
    private deckRegex = /hearthpwn\.com\/decks\/([0-9]+)[a-z\-]*/;

    canParse(url: string) {
        return this.deckRegex.test(url);
    };

    protected getDeckData(url: string) {
        return this.parseDeck(url).then(item => [item]);
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let name = $(".deck-title").text(),
                cards: { [cardName: string]: number } = {},
                date = new Date(0);
            date.setUTCSeconds(+$(".revision-listing abbr.standard-date").attr("data-epoch"));
            if (isNaN(date.valueOf())) {
                date = new Date(0);
                date.setUTCSeconds(+$("li.last-updated abbr.standard-date").attr("data-epoch"));
            }

            $(".class-listing .listing, .neutral-listing .listing").find("[data-id]").each((_: number, cardEl: CheerioElement) => {
                let $td = $(cardEl).closest("td"),
                    info = $td.closest("td").text().trim().split("×"),
                    cardName = info[0].trim(),
                    count = +info[1].trim();
                cards[cardName] = count;
            });

            return <DeckData>{ name, url, cards, date };
        });
    }

};

export default new HearthPwnParser();