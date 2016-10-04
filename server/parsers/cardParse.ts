import * as Promise from "bluebird";
import Card, { CardDB } from "../db/card";
import getContent from "./utils";
import * as hsTypes from "../../interfaces/hs-types";
import mongoose from "../lib/mongoose";

let hearthPwnUrl = "http://www.hearthpwn.com/cards?page=@@@";
let hearthPwnUrlExt = "http://www.hearthpwn.com/cards?display=1&filter-premium=1&page=@@@";

export default function () {
    let cnt = 20,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => hearthPwnUrl.replace("@@@", (inx + 1) + "")),
        cards: { [id: string]: CardDB } = {};

    return Promise.map(urls, cardUrl => getContent(cardUrl), { concurrency: 3 })
        .map(($: CheerioStatic) => {
            $("table.listing.cards-visual.listing-cards>tbody tr").each((inx, el) => {
                let $tr = $(el),
                    card = new Card(),
                    token = false;

                card.name = $tr.find("h3").text();
                card.description = $tr.find(".visual-details-cell>p").text().trim();
                card.flavorText = $tr.find(".card-flavor-listing-text").text().trim();
                card.img = $tr.find(".visual-image-cell img").attr("src");
                card.class = hsTypes.CardClass.neutral;
                card.type = hsTypes.CardType.unknown;
                card.rarity = hsTypes.CardRarity.unknown;
                card.cardSet = hsTypes.CardSet.unknown;
                card.race = hsTypes.CardRace.none;
                card.url = "http://www.hearthpwn.com" + $tr.find(".visual-image-cell>a").attr("href");
                card.cost = 0;
                card.mana = 0;

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
                        card.cardSet = <hsTypes.CardSet>hsTypes.hsTypeConverter.cardSet($li.find("a").text());
                        return;
                    }

                    if ($li.text().indexOf("Race:") !== -1) {
                        card.race = hsTypes.CardRace[$li.find("a").text().trim().toLowerCase()] || card.race;
                        return;
                    }

                    if ($li.text() === "Token") {
                        token = true;
                        return;
                    }

                    if ($li.text().indexOf("Crafting Cost:") !== -1) {
                        card.cost = +$li.text().match(/([0-9]+)/g)[0];
                        return;
                    }
                });

                if (typeof card.cost === "undefined") {
                    card.cost = hsTypes.hsTypeConverter.getCardCost(card.rarity);
                }

                if ([
                    hsTypes.CardSet.Basic,
                    hsTypes.CardSet.BlackrockMountain,
                    hsTypes.CardSet.LeagueOfExplorers,
                    hsTypes.CardSet.OneNightInKarazhan
                ].indexOf(card.cardSet) >= 0) {
                    card.cost = 0;
                }


                if (card.cardSet === +hsTypes.CardSet.Basic) {
                    card.rarity = hsTypes.CardRarity.free;
                }

                if (!card.name || token || +card.type === +hsTypes.CardType.hero) {
                    console.log(`[skipped] token/hero: ${card.name}`);
                    return;
                }
                card._id = Card.generateId(card.name);
                cards[card._id] = card;
            });
        })
        .then(() => console.log("[done] loading basic card info from hearthpwn"))
        .then(() => getAdditionalCardInfo(cards));
};

function getAdditionalCardInfo(cards: { [id: string]: CardDB }) {
    let cnt = 15,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => hearthPwnUrlExt.replace("@@@", (inx + 1) + ""));

    return Promise.map(urls, cardUrl => getContent(cardUrl), { concurrency: 3 })
        .map(($: CheerioStatic) => {
            $("table.listing.listing-cards-tabular>tbody tr").each((inx, el) => {
                let $tr = $(el),
                    name = $tr.find(".col-name").text().trim(),
                    mana = +$tr.find(".col-cost").text().trim() || 0,
                    attack = +$tr.find(".col-attack").text().trim() || 0,
                    health = +$tr.find(".col-health").text().trim() || 0,
                    card = cards[Card.generateId(name)];

                if (!card) {
                    console.log(`card not found ${name}`);
                    return;
                }

                card.mana = mana;
                if (card.type === hsTypes.CardType.minion) {
                    card.attack = attack;
                    card.health = health;
                }

            });
        })
        .then(() => Card.insertMany(Object.keys(cards).map(key => cards[key])))
        .then(() => {
            console.log("[done] loading additional card info");
        }).catch(e => {
            console.log(e);
        });
}
