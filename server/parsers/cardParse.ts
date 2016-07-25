import * as Promise from "bluebird";
import dbUtils, {DBCard} from "../db";
import getContent from "./utils";
import * as hsTypes from "../../interfaces/hs-types";

let hearthPwnUrl = "http://www.hearthpwn.com/cards?page=@@@";
let icyVeinsUrl = "http://www.icy-veins.com/hearthstone/card-descriptions";

export default function (db: Loki = null) {
    let cnt = 20,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => hearthPwnUrl.replace("@@@", (inx + 1) + "")),
        cardCollection: LokiCollection<DBCard>;

    return (!db ?  dbUtils.ensureDb() : Promise.resolve(db) )
        .then(() => cardCollection = <LokiCollection<DBCard>>db.getCollection(dbUtils.collections.cards))
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
                        class: hsTypes.CardClass.neutral,
                        type: hsTypes.CardType.unknown,
                        rarity: hsTypes.CardRarity.unknown,
                        set: hsTypes.CardSet.unknown,
                        race: hsTypes.CardRace.none,
                        url: "http://www.hearthpwn.com" + $tr.find(".visual-image-cell>a").attr("href"),
                        cost: 0,
                        mana: 0,
                        token: false
                    };

                $tr.find(".visual-details-cell>ul>li").each((_, li) => {
                    let $li = $(li);

                    if ($li.text().indexOf("Type:") !== -1) {
                        card.type = hsTypes.CardType[$li.find("a").text().trim().toLowerCase()] || card.type;
                        return;
                    }

                    if ($li.text().indexOf("Class:") !== -1) {
                        card.class = hsTypes.CardClass[$li.find("a").text().trim().toLowerCase()] || card.class;
                        return;
                    }

                    if ($li.text().indexOf("Rarity:") !== -1) {
                        card.rarity = hsTypes.CardRarity[$li.find("a").text().trim().toLowerCase()] || card.rarity;
                        return;
                    }

                    if ($li.text().indexOf("Set:") !== -1) {
                        card.set = <hsTypes.CardSet>hsTypes.hsTypeConverter.cardSet($li.find("a").text());
                        return;
                    }

                    if ($li.text().indexOf("Race:") !== -1) {
                        card.race = hsTypes.CardRace[$li.find("a").text().trim().toLowerCase()] || card.race;
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
                    if ([hsTypes.CardSet.Basic, hsTypes.CardSet.BlackrockMountain, hsTypes.CardSet.LeagueOfExplorers].indexOf(card.set) >= 0) {
                        card.cost = 0;
                    }
                    else {
                        card.cost = hsTypes.hsTypeConverter.getCardCost(card.rarity);
                    }
                }

                if (!card.name || card.token || card.type === hsTypes.CardType.hero) {
                    console.log(`[skipped] token/hero: ${card.name}`);
                    return;
                }
                card.id = dbUtils.generateCardId(card.name);
                if (cardCollection.by("id", card.id)) {
                    console.log(`[skipped] card ${card.name}`);
                    return;
                }
                console.log(`[added] ${card.name}`);
                cardCollection.insert(card);
            });
        })
        .then(() => console.log("[done] loading basic card info from hearthpwn"))
        .then(() => getAdditionalCardInfo(cardCollection));
};

function getAdditionalCardInfo(cardCollection: LokiCollection<DBCard>) {
    return getContent(icyVeinsUrl)
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
                        card = cardCollection.by("id", dbUtils.generateCardId(name));

                    if (!card) {
                        console.log(`card not found ${name}`);
                        return;
                    }

                    card.mana = mana;
                    if (card.type === hsTypes.CardType.minion) {
                        card.attack = attack;
                        card.health = health;
                    }
                    cardCollection.update(card);
                });

            });

        }, { concurrency: 2 })
        .then(() => {
            console.log("[done] loading additional card info from icy veins");
        }).catch(e => {
            console.log(e);
        });
}

interface CardRaw extends DBCard {
    token: boolean;
}