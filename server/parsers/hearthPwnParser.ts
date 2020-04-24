import { getContent } from '../lib/request';
import { BaseDeckParser, DeckData } from './base/baseDeckParser';

class HearthPwnParser extends BaseDeckParser {
    private baseUrl = 'https://hearthpwn.com';
    private deckRegex = /hearthpwn\.com\/decks\/([0-9]+)[a-z\-]*/;
    private relativeDeckRegex = /\/decks\/[0-9a-z\-]+\/?$/;
    private siteRegex = /hearthpwn\.com/;
    name = 'HearthPwn';

    canParse(url: string) {
        return this.siteRegex.test(url);
    }

    protected getDeckData(url: string) {
        if (this.deckRegex.test(url)) {
            return this.parseDeck(url).then(item => [item]);
        }
        return this.parseDeckList(url);
    }

    private parseDeckList(url: string) {
        console.log(`parsing ${url} for decks`);
        return getContent(url)
            .then($ => {
                const unique = {};
                $(`a`).each((inx: number, el: CheerioElement) => unique[($(el) as any).prop('href')] = true);
                return Object.keys(unique).filter(linkUrl => this.relativeDeckRegex.test(linkUrl)).map(linkUrl => this.toAbsoluteUrl(linkUrl));
            })
            .map((deckUrl: string) => this.parseDeck(`${deckUrl}`), { concurrency: 2 });
    }

    private toAbsoluteUrl(relativeUrl: string) {
        if (relativeUrl.startsWith('/')) {
            relativeUrl = relativeUrl.slice(1);
        }
        return `${this.baseUrl}/${relativeUrl}`;
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            const name = $('.deck-title').text(),
                cards: { [cardName: string]: number } = {};
            let date = new Date(0);
            date.setUTCSeconds(+$('.revision-listing abbr.standard-date').attr('data-epoch'));
            if (isNaN(date.valueOf())) {
                date = new Date(0);
                date.setUTCSeconds(+$('li.last-updated abbr.standard-date').attr('data-epoch'));
            }

            $('.class-listing .listing, .neutral-listing .listing').find('[data-id]').each((_: number, cardEl: CheerioElement) => {
                const $td = $(cardEl).closest('td'),
                    info = $td.closest('td').text().trim().split('×'),
                    cardName = info[0].trim(),
                    count = +info[1].trim();
                cards[cardName] = count;
            });

            return <DeckData>{ name, url, cards, date };
        });
    }

}

export default new HearthPwnParser();
