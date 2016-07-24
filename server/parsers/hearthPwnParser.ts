import * as Promise from "bluebird";
import dbUtils, {DBCard, DBDeck} from "../db";
import getContent from "./utils";
import {BaseDeckParser} from "./baseDeckParser";

class HearthPwnParser extends BaseDeckParser {
    siteName = "hearthpwn.com";
   parseDeckList(url: string, save: boolean) {
        console.log(`parsing ${url}`);
        return dbUtils.ensureDb()
            .then(() => getContent(url))
            .then($ => {
                let unique = {};
                $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
                return Object.keys(unique);
            })
            .map((deckUrl: string) => this.parseDeck(deckUrl, false), { concurrency: 2 })
            .then(() => {
                if (save) {
                    return dbUtils.saveDb();
                }
            });
    }

    parseDeck(url: string, save: boolean) {
        console.log(`parsing ${url}`);

        return getContent(url).then($ => {
            let deck: DBDeck = {
                name: $("main>article>header>h1").text(),
                class: dbUtils.hsClasses.unknown,
                url: url,
                cost: 0,
                costApprox: false,
                cards: {},
                hash: ""
            },
                $cardTable = $("main table").first();

            $cardTable.find("tr").each((_, tr) => {
                $(tr).find("td").each((inx, td) => {
                    let $el = $(td).find("span[data-card]");
                    if (!$el.length) {
                        return;
                    }

                    let cardId = dbUtils.generateCardId($el.first().text().trim()),
                        count = +$el.parent().contents().first().text()[0],
                        card = <DBCard>dbUtils.getCards().by("id", cardId);

                    if (!card) {
                        console.log(`${card.name} is not found in db`);
                        return;
                    }
                    deck.cards[cardId] = count;

                    if (deck.class === dbUtils.hsClasses.unknown && card.class !== dbUtils.hsClasses.neutral) {
                        deck.class = card.class;
                    }

                    if (typeof card.cost === "undefined") {
                        deck.costApprox = true;
                    }
                    else {
                        deck.cost += card.cost * count;
                    }
                });
            });

            dbUtils.getDecks().insert(deck);
            if (save) {
                return dbUtils.saveDb();
            }
        });
    }

    parse(url: string, save: boolean) {
        console.log(`parsing ${url}`);
        return Promise.reject("not implemented");
    }
};

export default new HearthPwnParser();