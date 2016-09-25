import * as Promise from "bluebird";
import {ParseReportItem} from "./index";
import {getJSON} from "./utils";
import {BaseDeckParser} from "./baseDeckParser";



class TempoStormParser extends BaseDeckParser {
    private deckRegex = /tempostorm\.com\/hearthstone\/decks\/([0-9a-z\-]+)/;
    private deckListRegex = /tempostorm\.com\/hearthstone\/meta-snapshot\/standard\/([0-9a-z\-]+)/;

    parse(userId: string, url: string, save: boolean) {
        if (this.deckRegex.test(url)) {
            return this.parseDeck(userId, url, save).then(reportItem => [reportItem]);
        }
        if (this.deckListRegex.test(url)) {
            return this.parseDeckList(userId, url, save);
        }

        return this.reportUnrecognized(url);
    }

    canParse(url) {
        return this.deckRegex.test(url) || this.deckListRegex.test(url);
    }

    private parseDeckList(userId: string, url: string, save: boolean): Promise<ParseReportItem[]> {
        console.log(`parsing ${url}`);
        return this.getDeckListJSON(url).then(obj => {

            let promises = obj.deckTiers.map(tier => {
                let deckUrl = `https://tempostorm.com/hearthstone/decks/${tier.deck.slugs[0].slug}`,
                    date = new Date(tier.deck.createdDate),
                    cards: { [cardName: string]: number } = {};
                tier.deck.cards.forEach(c => cards[c.card.name] = c.cardQuantity);
                return this.addDeckUnsafe(userId, tier.name, deckUrl, cards, date);
            });

            return Promise.all(promises);
        });
    }

    private parseDeck(userId: string, url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return this.getDeckJSON(url).then(obj => {
            let cards: { [cardName: string]: number } = {};
            obj.cards.forEach(c => cards[c.card.name] = c.cardQuantity);
            return this.addDeckUnsafe(userId, obj.name, url, cards, new Date(obj.createdDate));
        });
    }

    private getDeckListJSON(url): Promise<DeckListResponseObj> {
        let listName = url.match(this.deckListRegex)[1],
            payload = {
                "where": {
                    "slug": listName,
                    "snapshotType": "standard"
                },
                "include": [
                    {
                        "relation": "deckTiers",
                        "scope": {
                            "include": [
                                {
                                    "relation": "deck",
                                    "scope": {
                                        "fields": [
                                            "id",
                                            "name",
                                            "createdDate",
                                            "slug",
                                            "playerClass"
                                        ],
                                        "include": [
                                            {
                                                "relation": "slugs",
                                                "scope": {
                                                    "fields": [
                                                        "linked",
                                                        "slug"
                                                    ]
                                                },
                                            },
                                            {
                                                "relation": "cards",
                                                "scope": {
                                                    "include": "card",
                                                    "scope": {
                                                        "fields": ["id", "name"]
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
        return getJSON("https://tempostorm.com/api/snapshots/findOne?filter=" + encodeURIComponent(JSON.stringify(payload)));
    }

    private getDeckJSON(url: string): Promise<DeckResponseObj> {
        let deckName = url.match(this.deckRegex)[1],
            payload = {
                where: {
                    slug: deckName
                },
                fields: ["id", "createdDate", "name"],
                include: [
                    {
                        relation: "cards",
                        scope: {
                            include: "card",
                            scope: {
                                fields: ["id", "name"]
                            }
                        }
                    }
                ]
            };


        return getJSON("https://tempostorm.com/api/decks/findOne?filter=" + encodeURIComponent(JSON.stringify(payload)));
    }
};

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