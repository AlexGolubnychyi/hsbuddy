let Promise = require("bluebird"),
    debugIndex = 0,
    url = "http://hearthstone.metabomb.net/game-guides/the-best-standard-hearthstone-decks-july-2016-season-28",
    dbUtils = require("../db"),
    getContent = require("./utils.js").getContent,
    keywords = {
        deckUrl: "deck-list"
    },
    generatePage = require("../view/generateDeckList");


module.exports.parse = function() {
    let db;

    return dbUtils.get()
        .then(database => db = database)
        .then(() => getContent(url))
        .then($ => {
            let unique = {},
                decksUrls = $(`[href*=${keywords.deckUrl}]`).each((inx, el) => unique[$(el).prop("href")] = true);
            return Object.keys(unique);
        }).map(deckUrl => {
            console.log(debugIndex++);
            return getContent(deckUrl).then($ => {
                let deck = {
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
                        
                        if (!card){
                            console.log(`${card.name} is not found in db`);
                            return;
                        }
                        deck.cards[cardId] = count;
                        
                        if (card.cost === "unknown"){
                            deck.costApprox = true;
                        }
                        else{
                            deck.cost += card.cost*count;
                        }
                    });
                });

                db.decks[deck.name] = deck;

            });

        }, { concurrency: 2 }).then(() => {
            return dbUtils.save(db);
        }).then(() => {
            console.log("metabomb done!");
            return generatePage();
        }).catch(e => {
            console.log(e);
        });
};
