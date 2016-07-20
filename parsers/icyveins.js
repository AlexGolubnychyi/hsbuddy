let Promise = require("bluebird"),
    dbUtils = require("../db"),
    url = "http://www.icy-veins.com/hearthstone/card-descriptions";
    getContent = require("./utils.js").getContent;


module.exports.parse = function() {
    let db;

    return dbUtils.get()
        .then(database => db = database)
        .then(() => getContent(url))
        .then($ => {
            let unique = {},
                decksUrls = $(`.page_content .nav_content_block_entry a`).each((inx, el) => unique[$(el).prop("href")] = true);
            return Object.keys(unique);
        })
        .map(cardListUrl => {

            return getContent(cardListUrl).then($ => {
                $(".card_table tr").each((inx,el) => {
                    let $tds = $(el).find("td");
                    if (!$tds.length){
                        return;
                    }

                    let name = $tds.eq(0).find("a").text(),
                        mana = +$tds.eq(2).text().trim(),
                        attack = +$tds.eq(3).text().trim(),
                        health = +$tds.eq(4).text().trim(),
                        card = db.cards[dbUtils.generateCardId(name)];

                    if (!card){
                        console.log(`card not found ${name}`);
                        return;
                    }

                    card.mana = mana;
                    if (card.type.toLowerCase() === "minion"){
                        card.attack = attack;
                        card.health = health;
                    }
                });

            });

        }, { concurrency: 2 }).then(() => {
            return dbUtils.save(db);
        }).then(() => {
            console.log("icyveins done!");
        }).catch(e => {
            console.log(e);
        });
};