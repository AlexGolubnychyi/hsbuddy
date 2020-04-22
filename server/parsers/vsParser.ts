import { getContent } from '../lib/request';
import { BaseDeckParser, DeckData } from './base/baseDeckParser';
import { deckEncoder } from '../db/utils/deckEncoder';

class VsParser extends BaseDeckParser {
    private deckRegex =  /vicioussyndicate\.com\/decks\/([a-z0-9\-]+)/;
    private deckListRegex = /vicioussyndicate\.com\/vs-data-reaper-report-([0-9]+)/;
    name = 'VS';

    canParse(url: string) {
        return this.deckRegex.test(url) || this.deckListRegex.test(url);
    }

    protected getDeckData(url: string) {
        if (this.deckRegex.test(url)){
            return this.parseDeck(url).then(reportItem => [reportItem]);
        }
        return this.parseDeckList(url);
    }

    private parseDeckList(url: string) {
        console.log(`parsing ${url} for decks`);
        return getContent(url)
            .then($ => {
                const unique = {};
                $(`a`).each((inx: number, el: CheerioElement) => unique[($(el) as any).prop('href')] = true);
                return Object.keys(unique).filter(linkUrl => this.deckRegex.test(linkUrl));
            })
            .map((deckUrl: string) => this.parseDeck(deckUrl), { concurrency: 2 });
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            const name = $('h1.entry-title').text(),
                deckCode = $('.deck-input').val(),
                date = (Array.prototype.slice.call($('.top-dec-selection .info')) as Cheerio[])
                        .map(el => new Date($(el).text()))
                        .filter(dt => dt.getFullYear() > 2014 && dt.getFullYear() < 2050)[0] || new Date();

            return deckEncoder.decode(deckCode).then(cards => {
                return <DeckData>{ name, url, date, cards };
            });
        });
    }
}

export const vsParser = new VsParser();
