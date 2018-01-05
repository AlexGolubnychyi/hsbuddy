import * as Promise from 'bluebird';
import { BaseDeckParser, DeckData } from './base/baseDeckParser';
import { deckEncoder } from '../db/utils/deckEncoder';




export class DeckImportCodeParser extends BaseDeckParser {
    private deckRegex = /^[A-Za-z0-9+/=]+$/;
    name = 'DeckCode';
    protected getDeckData(url: string): Promise<DeckData[]> {
        return this.parseDeck(url).then(reportItem => [reportItem]);
    }

    protected urlClean(url: string) {
        // apply no url cleaning
        return url;
    }

    canParse(url: string) {
        return this.deckRegex.test(url);
    }

    private parseDeck(importCode: string): Promise<DeckData> {
        return deckEncoder.decode(importCode).then(cards => {
            return <DeckData>{
                name: 'Imported Deck',
                url: '',
                date: new Date(),
                cards
            };
        });
    }

}

export const deckImportCodeParser = new DeckImportCodeParser();
