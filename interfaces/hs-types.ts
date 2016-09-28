export enum CardRarity { unknown, free, common, rare, epic, legendary };
export enum CardClass { unknown, neutral, druid, hunter, mage, paladin, priest, rogue, shaman, warlock, warrior };
export enum CardType { unknown, weapon, ability, minion, hero };
export enum CardSet {
    unknown = 0, Basic, Expert, BlackrockMountain, TheGrandTournament,
    LeagueOfExplorers, WhispersoftheOldGods, Naxxramas, GoblinsvsGnomes, Reward, OneNightInKarazhan
};
export enum CardRace { none = 0, beast, demon, dragon, mech, murloc, pirate, totem };

export var standardCardSets = [
    CardSet.Basic,
    CardSet.BlackrockMountain,
    CardSet.Expert,
    CardSet.LeagueOfExplorers,
    CardSet.TheGrandTournament,
    CardSet.WhispersoftheOldGods,
    CardSet.OneNightInKarazhan
];

export var dust = "dust";

const rarityMapping = [-1, 0, 40, 100, 400, 1600],
    cardSetMapping = ["-", "Basic", "Expert", "Blackrock Mountain", "The Grand Tournament", "League of Explorers",
        "Whispers of the Old Gods", "Curse of Naxxramas", "Goblins vs Gnomes", "Reward", "One Night in Karazhan"];

class HsTypeConverter {
    getEnumLabel(enumerable: { [index: number]: string }, key: number) {
        return key === 0 ? "-" : enumerable[key];
    }

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
