"use strict";
(function (CardRarity) {
    CardRarity[CardRarity["unknown"] = 0] = "unknown";
    CardRarity[CardRarity["free"] = 1] = "free";
    CardRarity[CardRarity["common"] = 2] = "common";
    CardRarity[CardRarity["rare"] = 3] = "rare";
    CardRarity[CardRarity["epic"] = 4] = "epic";
    CardRarity[CardRarity["legendary"] = 5] = "legendary";
})(exports.CardRarity || (exports.CardRarity = {}));
var CardRarity = exports.CardRarity;
;
(function (CardClass) {
    CardClass[CardClass["unknown"] = 0] = "unknown";
    CardClass[CardClass["neutral"] = 1] = "neutral";
    CardClass[CardClass["druid"] = 2] = "druid";
    CardClass[CardClass["hunter"] = 3] = "hunter";
    CardClass[CardClass["mage"] = 4] = "mage";
    CardClass[CardClass["paladin"] = 5] = "paladin";
    CardClass[CardClass["priest"] = 6] = "priest";
    CardClass[CardClass["rogue"] = 7] = "rogue";
    CardClass[CardClass["shaman"] = 8] = "shaman";
    CardClass[CardClass["warlock"] = 9] = "warlock";
    CardClass[CardClass["warrior"] = 10] = "warrior";
})(exports.CardClass || (exports.CardClass = {}));
var CardClass = exports.CardClass;
;
(function (CardType) {
    CardType[CardType["unknown"] = 0] = "unknown";
    CardType[CardType["ability"] = 1] = "ability";
    CardType[CardType["minion"] = 2] = "minion";
    CardType[CardType["hero"] = 3] = "hero";
})(exports.CardType || (exports.CardType = {}));
var CardType = exports.CardType;
;
(function (CardSet) {
    CardSet[CardSet["unknown"] = 0] = "unknown";
    CardSet[CardSet["Basic"] = 1] = "Basic";
    CardSet[CardSet["Expert"] = 2] = "Expert";
    CardSet[CardSet["BlackrockMountain"] = 3] = "BlackrockMountain";
    CardSet[CardSet["TheGrandTournament"] = 4] = "TheGrandTournament";
    CardSet[CardSet["LeagueOfExplorers"] = 5] = "LeagueOfExplorers";
    CardSet[CardSet["WhispersoftheOldGods"] = 6] = "WhispersoftheOldGods";
    CardSet[CardSet["Naxxramas"] = 7] = "Naxxramas";
    CardSet[CardSet["GoblinsvsGnomes"] = 8] = "GoblinsvsGnomes";
    CardSet[CardSet["Reward"] = 9] = "Reward";
})(exports.CardSet || (exports.CardSet = {}));
var CardSet = exports.CardSet;
;
(function (CardRace) {
    CardRace[CardRace["none"] = 0] = "none";
    CardRace[CardRace["beast"] = 1] = "beast";
    CardRace[CardRace["demon"] = 2] = "demon";
    CardRace[CardRace["dragon"] = 3] = "dragon";
    CardRace[CardRace["mech"] = 4] = "mech";
    CardRace[CardRace["murloc"] = 5] = "murloc";
    CardRace[CardRace["pirate"] = 6] = "pirate";
    CardRace[CardRace["totem"] = 7] = "totem";
})(exports.CardRace || (exports.CardRace = {}));
var CardRace = exports.CardRace;
;
var rarityMapping = [-1, 0, 40, 100, 400, 1600];
var cardSetMapping = ["-", "Basic", "Expert", "Blackrock Mountain", "The Grand Tournament", "League of Explorers",
    "Whispers of the Old Gods", "Naxxramas", "Goblins vs Gnomes", "Reward"];
var HsTypeConverter = (function () {
    function HsTypeConverter() {
    }
    HsTypeConverter.prototype.getCardCost = function (rarity) {
        return rarityMapping[rarity];
    };
    HsTypeConverter.prototype.cardSet = function (set) {
        if (typeof set === "string") {
            var inx = cardSetMapping.indexOf(set.trim());
            if (inx < 0) {
                inx = 0;
            }
            return inx;
        }
        return cardSetMapping[set];
    };
    return HsTypeConverter;
}());
exports.hsTypeConverter = new HsTypeConverter();
//# sourceMappingURL=hs-types.js.map