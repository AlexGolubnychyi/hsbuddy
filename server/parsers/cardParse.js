"use strict";
var Promise = require("bluebird");
var db_1 = require("../db");
var utils_1 = require("./utils");
var hsTypes = require("../../interfaces/hs-types");
var hearthPwnUrl = "http://www.hearthpwn.com/cards?page=@@@";
var icyVeinsUrl = "http://www.icy-veins.com/hearthstone/card-descriptions";
function default_1(db) {
    if (db === void 0) { db = null; }
    var cnt = 20, urls = new Array(cnt).join(",").split(",").map(function (_, inx) { return hearthPwnUrl.replace("@@@", (inx + 1) + ""); }), cardCollection;
    return (!db ? db_1.default.ensureDb() : Promise.resolve(db))
        .then(function () { return cardCollection = db.getCollection(db_1.default.collections.cards); })
        .then(function () { return Promise.map(urls, function (cardUrl) { return utils_1.default(cardUrl); }, { concurrency: 3 }); })
        .map(function ($) {
        $("table.listing.cards-visual.listing-cards>tbody tr").each(function (inx, el) {
            var $tr = $(el), card = {
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
            $tr.find(".visual-details-cell>ul>li").each(function (_, li) {
                var $li = $(li);
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
                    card.set = hsTypes.hsTypeConverter.cardSet($li.find("a").text());
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
                console.log("[skipped] token/hero: " + card.name);
                return;
            }
            card.id = db_1.default.generateCardId(card.name);
            if (cardCollection.by("id", card.id)) {
                console.log("[skipped] card " + card.name);
                return;
            }
            console.log("[added] " + card.name);
            cardCollection.insert(card);
        });
    })
        .then(function () { return console.log("[done] loading basic card info from hearthpwn"); })
        .then(function () { return getAdditionalCardInfo(cardCollection); });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
function getAdditionalCardInfo(cardCollection) {
    return utils_1.default(icyVeinsUrl)
        .then(function ($) {
        var unique = {};
        $(".page_content .nav_content_block_entry a").each(function (inx, el) { return unique[$(el).prop("href")] = true; });
        return Object.keys(unique);
    })
        .map(function (cardListUrl) {
        return utils_1.default(cardListUrl).then(function ($) {
            $(".card_table tr").each(function (inx, el) {
                var $tds = $(el).find("td");
                if (!$tds.length) {
                    return;
                }
                var name = $tds.eq(0).find("a").text(), mana = +$tds.eq(2).text().trim(), attack = +$tds.eq(3).text().trim(), health = +$tds.eq(4).text().trim(), card = cardCollection.by("id", db_1.default.generateCardId(name));
                if (!card) {
                    console.log("card not found " + name);
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
        .then(function () {
        console.log("[done] loading additional card info from icy veins");
    }).catch(function (e) {
        console.log(e);
    });
}
//# sourceMappingURL=cardParse.js.map