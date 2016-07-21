import dbUtils, {DB, DBDeck} from "../db";
import getContent from "./utils";

let url = "http://hearthstone.metabomb.net/game-guides/the-best-standard-hearthstone-decks-july-2016-season-28",
    keywords = {
        deckUrl: "deck-list"
    };

export default function () {
    let db: DB;

    return dbUtils.get()
        .then(database => db = database)
        .then(() => getContent(url))
        .then($ => {
            let unique = {};
            $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[$(el).prop("href")] = true);
            return Object.keys(unique);
        }).map((deckUrl: string) => {
            return getContent(deckUrl).then($ => {
                let deck: DBDeck = {
                    name: $("main>article>header>h1").text(),
                    url: deckUrl,
                    cost: 0,
                    costApprox: false,
                    cards: {}
                },
                    $cardTable = $("main table").first();

                $cardTable.find("tr").each((_, tr) => {
                    $(tr).find("td").each((inx, td) => {
                        let $el = $(td).find("span[data-card]");
                        if (!$el.length) {
                            return;
                        }

                        // let card = {
                        //     id: $el.attr("data-card"),
                        //     type: $el.attr("class") || $el.find("span[class!='']").attr("class"),
                        //     name: $el.first().text(),
                        //     count: +$el.parent().contents().first().text()[0],
                        //     neutral: inx % 2 !== 0
                        // };
                        // card.img = `http://cdn.gamer-network.net/2014/metabomb/hearthstone/cards/${card.id}.png`;

                        let cardId = dbUtils.generateCardId($el.first().text().trim()),
                            count = +$el.parent().contents().first().text()[0],
                            card = db.cards[cardId];

                        if (!card) {
                            console.log(`${card.name} is not found in db`);
                            return;
                        }
                        deck.cards[cardId] = count;

                        if (typeof card.cost === "undefined") {
                            deck.costApprox = true;
                        }
                        else {
                            deck.cost += card.cost * count;
                        }
                    });
                });

                db.decks[deck.name] = deck;

            });

        }, { concurrency: 2 }).then(() => {
            return dbUtils.save(db);
        }).then(() => {
            console.log("metabomb done!");
        }).catch(e => {
            console.log(e);
        });
};
