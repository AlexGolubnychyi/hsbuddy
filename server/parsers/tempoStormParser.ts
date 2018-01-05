import * as Promise from 'bluebird';
import { getJSON } from '../lib/request';
import { BaseDeckParser, DeckData } from './base/baseDeckParser';



class TempoStormParser extends BaseDeckParser {
    private deckRegex = /tempostorm\.com\/hearthstone\/decks\/([0-9a-z\-]+)/;
    private deckListRegex = /tempostorm\.com\/hearthstone\/meta-snapshot\/standard\/([0-9a-z\-]+)/;
    name = 'TempoStorm';
    protected getDeckData(url: string) {
        if (this.deckRegex.test(url)) {
            return this.parseDeck(url).then(reportItem => [reportItem]);
        }

        return this.parseDeckList(url);
    }

    canParse(url: string) {
        return this.deckRegex.test(url) || this.deckListRegex.test(url);
    }

    private parseDeckList(url: string) {
        console.log(`parsing ${url}`);
        return this.getDeckListJSON(url).then(obj => {

            const promises = obj.deckTiers.map(tier => {
                const deckUrl = `https://tempostorm.com/hearthstone/decks/${tier.deck.slugs[0].slug}`,
                    date = new Date(tier.deck.createdDate),
                    cards: { [cardName: string]: number } = {};
                tier.deck.cards.forEach(c => cards[c.card.name] = c.cardQuantity);
                return <DeckData>{ name: tier.name, url: deckUrl, cards, date };
            });

            return Promise.all(promises);
        });
    }

    private parseDeck(url: string) {
        console.log(`parsing ${url}`);

        return this.getDeckJSON(url)
            .then(obj => {
                const cards: { [cardName: string]: number } = {};
                obj.cards.forEach(c => cards[c.card.name] = c.cardQuantity);
                return <DeckData>{ name: obj.name, url, cards, date: new Date(obj.createdDate) };
            });

    }

    private getDeckListJSON(url: string): Promise<DeckListResponseObj> {
        const listName = url.match(this.deckListRegex)[1],
            payload = {
                'where': {
                    'slug': listName,
                    'snapshotType': 'standard'
                },
                'include': [
                    {
                        'relation': 'deckTiers',
                        'scope': {
                            'include': [
                                {
                                    'relation': 'deck',
                                    'scope': {
                                        'fields': [
                                            'id',
                                            'name',
                                            'createdDate',
                                            'slug',
                                            'playerClass'
                                        ],
                                        'include': [
                                            {
                                                'relation': 'slugs',
                                                'scope': {
                                                    'fields': [
                                                        'linked',
                                                        'slug'
                                                    ]
                                                },
                                            },
                                            {
                                                'relation': 'cards',
                                                'scope': {
                                                    'include': 'card',
                                                    'scope': {
                                                        'fields': ['id', 'name']
                                                    }
                                                }
                                            }
                                        ],
                                    }
                                }
                            ]
                        }
                    }
                ]

            };
        return getJSON('https://tempostorm.com/api/snapshots/findOne?filter=' + encodeURIComponent(JSON.stringify(payload)));
    }

    private getDeckJSON(url: string): Promise<DeckResponseObj> {
        const deckName = url.match(this.deckRegex)[1],
            payload = {
                where: {
                    slug: deckName
                },
                fields: ['id', 'createdDate', 'name'],
                include: [
                    {
                        relation: 'cards',
                        scope: {
                            include: 'card',
                            scope: {
                                fields: ['id', 'name']
                            }
                        }
                    }
                ]
            };


        return getJSON('https://tempostorm.com/api/decks/findOne?filter=' + encodeURIComponent(JSON.stringify(payload)));
    }
}

export default new TempoStormParser();

interface DeckResponseObj {
    id: string;
    name: string;
    createdDate: string;
    cards: {
        cardQuantity: number,
        card: {
            name: string;
        }
    }[];
}

interface DeckListResponseObj {
    deckTiers: {
        deck: {
            createdDate: string,
            cards: {
                cardQuantity: number,
                card: {
                    name: string;
                }
            }[];
            slugs: {
                slug: string;
            }[];
        },
        name: string;
        tier: number;
    }[];
}
