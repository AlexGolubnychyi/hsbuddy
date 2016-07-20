let Promise = require("bluebird"),
    debugIndex = 0,
    url = "http://www.hearthpwn.com/cards?filter-show-standard=y&page=@@@",
    dbUtils = require("../db"),
    getContent = require("./utils.js").getContent;



module.exports.parse = () => {
    let cnt = 20,
        urls = new Array(cnt).join(",").split(",").map((_, inx) => url.replace("@@@", inx + 1)),
        db;

    return dbUtils.get()
        .then(database => db = database)
        .then(() => Promise.map(urls, url => getContent(url), { concurrency: 3 }))
        .map($ => {
            $("table.listing.cards-visual.listing-cards>tbody tr").each((inx, el) => {
                let $tr = $(el),
                    card = {
                        name: $tr.find("h3").text(),
                        description: $tr.find(".visual-details-cell>p").text().trim(),
                        flavorText: $tr.find(".card-flavor-listing-text").text().trim(),
                        img: $tr.find(".visual-image-cell img").attr("src"),
                        class: "neutral",
                        type: "",
                        rarity: "",
                        set: "",
                        race: "",
                        url: "http://www.hearthpwn.com" + $tr.find(".visual-image-cell>a").attr("href")
                    };

                $tr.find(".visual-details-cell>ul>li").each((inx, el) => {
                    let $li = $(el);

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
                        card.cost = $li.text().match(/([0-9]+)/g)[0];
                        return;
                    }
                });

                if (typeof card.cost === "undefined") {
                    if (/basic|blackrock mountain|league of explorers/.test(card.set.toLowerCase())) {
                        card.cost = 0;
                    }
                    else {
                        card.cost = db.cardTypes[card.rarity.toLowerCase()] || "unknown";
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
