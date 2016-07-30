import * as Promise from "bluebird";
import {ParseReportItem} from "./index";
import {getJSON} from "./utils";
import {BaseDeckParser} from "./baseDeckParser";


class TempoStormParser extends BaseDeckParser {
    siteName = "tempostorm.com";

    parseDeckList(url: string, save: boolean): Promise<ParseReportItem[]> {
        return <any>Promise.reject("not implemented");
        // console.log(`parsing ${url}`);
        // return dbUtils.ensureDb()
        //     .then(() => getContent(url))
        //     .then($ => {
        //         let unique = {};
        //         $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
        //         return Object.keys(unique);
        //     })
        //     .map((deckUrl: string) => this.parseDeck(deckUrl, false), { concurrency: 2 })
        //     .then(() => {
        //         if (save) {
        //             return dbUtils.saveDb();
        //         }
        //     });
    }

    parseDeck(url: string, save: boolean) {

        console.log(`parsing ${url}`);

        return this.getJSON(url).then(obj => {
            let cards: { [cardName: string]: number } = {};
            obj.cards.forEach(c => cards[c.card.name] = c.cardQuantity);
            return this.addDeckUnsafe(obj.name, url, cards);
        });
    }

    parse(url: string, save: boolean) {
        if (this.isDeckUrl(url)) {
            return this.parseDeck(url, save).then(reportItem => [reportItem]);
        }

        return this.parseDeckList(url, save);
    }

    private isDeckUrl(url) {
        return /tempostorm\.com\/hearthstone\/decks\/[0-9a-z\-]/.test(url);
    }

    private getJSON(url): Promise<ResponseObj> {
        let deckName = url.trim("/").split("/").pop().trim(),
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

interface ResponseObj {
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