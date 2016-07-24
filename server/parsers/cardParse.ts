import * as Promise from "bluebird";
import dbUtils, {DBCard} from "../db";
import getContent from "./utils";

let hearthPwnUrl = "http://www.hearthpwn.com/cards?page=@@@";
let icyVeinsUrl = "http://www.icy-veins.com/hearthstone/card-descriptions";

export default function () {
    let cnt = 20,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => hearthPwnUrl.replace("@@@", (inx + 1) + ""));

    return dbUtils
        .ensureDb()
        .then(() => Promise.map(urls, cardUrl => getContent(cardUrl), { concurrency: 3 }))
        .map(($: CheerioStatic) => {
            $("table.listing.cards-visual.listing-cards>tbody tr").each((inx, el) => {
                let $tr = $(el),
                    card: CardRaw = {
                        id: "",
                        name: $tr.find("h3").text(),
                        description: $tr.find(".visual-details-cell>p").text().trim(),
                        flavorText: $tr.find(".card-flavor-listing-text").text().trim(),
                        img: $tr.find(".visual-image-cell img").attr("src"),
                        class: "neutral",
                        type: "",
                        rarity: "",
                        set: "",
                        race: "",
                        url: "http://www.hearthpwn.com" + $tr.find(".visual-image-cell>a").attr("href"),
                        cost: 0,
                        mana: 0,
                        token: false
                    };

                $tr.find(".visual-details-cell>ul>li").each((_, li) => {
                    let $li = $(li);

                    if ($li.text().indexOf("Type:") !== -1) {
                        card.type = $li.find("a").text().trim();
                        return;
                    }

                    if ($li.text().indexOf("Class:") !== -1) {
                        card.class = dbUtils.parseHsClass($li.find("a").text());
                        return;
                    }

                    if ($li.text().indexOf("Rarity:") !== -1) {
                        card.rarity = $li.find("a").text().trim();
                        return;
                    }

                    if ($li.text().indexOf("Set:") !== -1) {
                        card.set = $li.find("a").text().trim();
                        return;
                    }

                    if ($li.text().indexOf("Race:") !== -1) {
                        card.race = $li.find("a").text().trim();
                        return;
                    }

                    if ($li.text() === "Token") {
                        card.token = true;
                        return;
                    }

                    if ($li.text().indexOf("Crafting Cost:") !== -1) {
                        card.cost = +$li.text().match(/([0-9]+)/g)[0];
                        return;
                    }
                });

                if (typeof card.cost === "undefined") {
                    if (/basic|blackrock mountain|league of explorers/.test(card.set.toLowerCase())) {
                        card.cost = 0;
                    }
                    else {
                        card.cost = dbUtils.cardTypes[card.rarity.toLowerCase()];
                    }
                }

                if (!card.name || card.token || card.type === "Hero") {
                    console.log(`[skipped] token/hero: ${card.name}`);
                    return;
                }
                card.id = dbUtils.generateCardId(card.name);
                if (dbUtils.getCards().by("id", card.id)) {
                    console.log(`[skipped] card ${card.name}`);
                    return;
                }
                console.log(`[added] ${card.name}`);
                dbUtils.getCards().insert(card);
            });
        })
        .then(() => dbUtils.saveDb())
        .then(() => console.log("hearthpwn done!"))
        .then(() => getAdditionalCardInfo());
};

function getAdditionalCardInfo() {


    return dbUtils.ensureDb()
        .then(() => getContent(icyVeinsUrl))
        .then($ => {
            let unique = {};
            $(`.page_content .nav_content_block_entry a`).each((inx, el) => unique[($(el) as any).prop("href")] = true);
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
}

interface CardRaw extends DBCard {
    token: boolean;
}