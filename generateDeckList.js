"use strict";
let Promise = require("bluebird"),
    writeFile = Promise.promisify(require("fs").writeFile),
    dbUtils = require("../db");



module.exports = function generatePage() {
    return dbUtils.get()
        .then(db => {
            let weight = card => {
                let baseWeight = card.mana, // + (card.class === "neutral" ? 1000 : 0),
                    rarity = card.rarity.toLowerCase();

                if (card.set.toLowerCase() === "basic") {
                    return baseWeight;
                }

                switch(rarity) {
                    case "legendary": return baseWeight + 400;
                    case "epic": return baseWeight + 300;
                    case "rare": return baseWeight + 200;
                    case "common": return baseWeight + 100;
                }

                return baseWeight;
            },
            decksText = Object.keys(db.decks).map(name => db.decks[name]).sort((f, s) => f.cost - s.cost).map(d => {
                let header = `<div style="clear:left">
                         <hr/>
                         <h2>
                            <a style="text-decoration:none;color:#f78f00;" href="${d.url}">${d.name} (${d.cost}${d.costApprox ? "?" : ""})</a>
                        </h2>
                        <hr/>
                      </div>`,

                content = Object.keys(d.cards)
                    .map(id => {
                        let card = db.cards[id];
                        card.count = d.cards[id];
                        return card;
                    })
                    .sort((f, s) => weight(f) - weight(s))
                    .map(c =>
                        `<div style="float: left;text-align: center;border: 1px solid lightgray;background-color: ${c.class === "neutral" ? "" : "aliceblue"};">
                             <div>
                                <a href="${c.url}"><img src="${c.img}" title="${c.flavorText}"/></a>
                             </div>
                             <div style="font-weight:bold;">${c.name} (${c.type}) x ${c.count}</div>
                            <!-- <div>mana: ${c.mana}, attack: ${c.attack || "-"}, health: ${c.health || "-"}</div> -->
                             <div>Dust: ${c.cost}</div>
                             <div style="visibility:${c.set ? "visible" : "hidden"}">Set: ${c.set}</div>
                         </div>`
                    ).join("");
                return header + content;
            }).join();

            var html = `
                <html>
                    <body>
                        <h1>Standart decks</h1>
                        ${decksText}
                    </body>
                </html>
                `;

            return writeFile("index.html", html);
        })
        .then(() => console.log("index.html generated successfully"));
};
