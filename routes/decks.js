"use strict";

let express = require("express"),
    router = express.Router(),
    dbUtils = require("../db");


router.get("/", (req, res, next) => {
    dbUtils.get().then(db => {
        let decks = Object.keys(db.decks)
            .map(name => db.decks[name])
            .sort((f, s) => f.cost - s.cost)
            .map(deck => {
                deck.cards = Object.keys(deck.cards)
                    .map(id => {
                        let card = db.cards[id];
                        card.count = deck.cards[id];
                        card.numberAvailable = card.numberAvailable || 0;
                        return card;
                    }).sort((f, s) => weightCard(f) - weightCard(s));
                return deck;
            });

        res.render("decks", { decks });
    });
});


function weightCard(card) {

    let baseWeight = card.mana, // + (card.class === "neutral" ? 1000 : 0),
        rarity = card.rarity.toLowerCase();

    if (card.set.toLowerCase() === "basic") {
        return baseWeight;
    }

    switch (rarity) {
        case "legendary": return baseWeight + 400;
        case "epic": return baseWeight + 300;
        case "rare": return baseWeight + 200;
        case "common": return baseWeight + 100;
    }

    return baseWeight;
}


module.exports = router;
