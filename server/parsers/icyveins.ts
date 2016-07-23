import dbUtils, {DBCard} from "../db";
import getContent from "./utils";
let url = "http://www.icy-veins.com/hearthstone/card-descriptions";

export default function () {

    return dbUtils.getDb()
        .then(() => getContent(url))
        .then($ => {
            let unique = {};
            $(`.page_content .nav_content_block_entry a`).each((inx, el) => unique[$(el).prop("href")] = true);
            return Object.keys(unique);
        })
        .map(cardListUrl => {

            return getContent(cardListUrl).then($ => {
                $(".card_table tr").each((inx, el) => {
                    let $tds = $(el).find("td");
                    if (!$tds.length) {
                        return;
                    }

                    let name = $tds.eq(0).find("a").text(),
                        mana = +$tds.eq(2).text().trim(),
                        attack = +$tds.eq(3).text().trim(),
                        health = +$tds.eq(4).text().trim(),
                        card = <DBCard>dbUtils.getCards().by("id", dbUtils.generateCardId(name));

                    if (!card) {
                        console.log(`card not found ${name}`);
                        return;
                    }

                    card.mana = mana;
                    if (card.type.toLowerCase() === "minion") {
                        card.attack = attack;
                        card.health = health;
                    }
                    dbUtils.getCards().update(card);
                });

            });

        }, { concurrency: 2 }).then(() => {
            return dbUtils.saveDb();
        }).then(() => {
            console.log("icyveins done!");
        }).catch(e => {
            console.log(e);
        });
};