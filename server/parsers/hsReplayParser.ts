import { DeckData, BaseDeckParser } from "./base/baseDeckParser";
import { getContent } from "../lib/request";
import { cardDB } from "../db/card";



class HsReplayParser extends BaseDeckParser {
    private deckRegex = /hsreplay\.net\/decks\/([0-9a-zA-Z\-\/]+)/;

    canParse(url: string) {
        return this.deckRegex.test(url.split("#")[0]);
    };

    protected getDeckData(url: string) {
        return this.parseDeck(url).then(item => [item]);
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let $info = $("#deck-info"),
                name = `hsReplays ${$info.attr("data-deck-class").trim().toLowerCase()} ${new Date().toLocaleDateString()}`,
                date = new Date(),
                dbfIds = $info.attr("data-deck-cards").trim().split(",");

            let cardHash: { [index: string]: number } = dbfIds.reduce((acc, cur) => (acc[cur] = (acc[cur] + 1) || 1, acc), {});

            return Promise
                .all(Object.keys(cardHash).map(dbfId => cardDB.findOne({ dbfId })))
                .then(dbCards => dbCards.map(c => ({ card: c.id, count: cardHash[c.dbfId] })))
                .then(cards => <DeckData>{ name, url, cards, date });
        });
    }
};

export const hsReplayParser = new HsReplayParser();
