import * as Promise from "bluebird";
import { BaseDeckParser, DeckData } from "./base/baseDeckParser";
import { deckEncoder } from "../db/utils/deckEncoder";




class DeckImportCodeParser extends BaseDeckParser {
    private deckRegex = /[A-Za-z0-9+/]+/;
    protected getDeckData(url: string): Promise<DeckData[]> {
        return this.parseDeck(url).then(reportItem => [reportItem]);
    }

    protected urlClean(url: string) {
        //apply no url cleaning
        return url;
    }

    canParse(url: string) {
        return this.deckRegex.test(url);
    }

    private parseDeck(importCode: string): Promise<DeckData> {
        return deckEncoder.decode(importCode).then(cards => {
            return <DeckData>{
                name: "Imported Deck",
                url: "",
                date: new Date(),
                cards: cards.reduce((acc, cur) => (acc[cur.card] = cur.count, acc), {})
            };
        });
    }

};

export const deckImportCodeParser = new DeckImportCodeParser();
