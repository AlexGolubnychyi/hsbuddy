export enum CardRarity { unknown, free, common, rare, epic, legendary };
export enum CardClass { unknown, neutral, druid, hunter, mage, paladin, priest, rogue, shaman, warlock, warrior };
export enum CardType { weapon, ability, minion, hero, unknown };
export enum CardSet {
    unknown = 0, Basic, Expert, BlackrockMountain, TheGrandTournament, LeagueOfExplorers, WhispersoftheOldGods, Naxxramas, GoblinsvsGnomes, Reward
};
export enum CardRace { none = 0, beast, demon, dragon, mech, murloc, pirate, totem };

let rarityMapping = [-1, 0, 40, 100, 400, 1600];
let cardSetMapping = ["-", "Basic", "Expert", "Blackrock Mountain", "The Grand Tournament", "League of Explorers",
    "Whispers of the Old Gods", "Curse of Naxxramas", "Goblins vs Gnomes", "Reward"];


class HsTypeConverter {
    getCardCost(rarity: CardRarity) {
        return rarityMapping[rarity];
    }

    cardSet(set: number | string): CardSet | string {
        if (typeof set === "string") {
            let inx = cardSetMapping.indexOf((<string>set).trim());
            if (inx < 0) {
                inx = 0;
            }

            return <CardSet>inx;
        }

        return cardSetMapping[(<number>set)];
    }

}

export var hsTypeConverter = new HsTypeConverter();
