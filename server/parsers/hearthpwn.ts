import * as Promise from "bluebird";
import dbUtils, {DB, DBCard} from "../db";
import getContent from "./utils";

let url = "http://www.hearthpwn.com/cards?filter-show-standard=y&page=@@@";

export default function() {
    let cnt = 20,
        db: DB,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => url.replace("@@@", (inx + 1) + ""));

    return dbUtils.get()
        .then(database => db = database)
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

                $tr.find(".visual-details-cell>ul>li").each((inx, li) => {
                    let $li = $(li);

                    if ($li.text().indexOf("Type:") !== -1) {
                        card.type = $li.find("a").text().trim();
                        return;
                    }

                    if ($li.text().indexOf("Class:") !== -1) {
                        card.class = $li.find("a").text().trim();
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
                        card.cost = db.cardTypes[card.rarity.toLowerCase()];
                    }
                }

                if (!card.name || card.token || card.type === "Hero") {
                    console.log(`skipping token/hero: ${card.name}`);
                    return;
                }
                card.id = dbUtils.generateCardId(card.name);

                // if (db.cards[card.id]) {
                //     console.log("conflict: ", card, db.cards[card.id]);
                // }

                db.cards[card.id] = card;
            });
        })
        .then(() => dbUtils.save(db))
        .then(() => console.log("hearthpwn done!"));
};


interface CardRaw extends DBCard {
    token: boolean;
}