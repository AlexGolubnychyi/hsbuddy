export enum CardRarity { unknown, free, common, rare, epic, legendary }
export enum CardClass { unknown, neutral, druid, hunter, mage, paladin, priest, rogue, shaman, warlock, warrior }
export enum CardType { unknown, weapon, ability, minion, hero }
export enum CardSet {
    unknown = 0, Basic, Expert, BlackrockMountain, TheGrandTournament,
    LeagueOfExplorers, WhispersoftheOldGods, Naxxramas, GoblinsvsGnomes, Reward, OneNightInKarazhan, MeanStreetsOfGadgetzan,
    JourneyToUnGoro, KnightsOfTheFrozenThrone, KoboldsAndCatacombs, TheWitchwood
}
export enum CardRace { none = 0, beast, demon, dragon, mech, murloc, pirate, totem, elemental }

export const standardCardSets = [
    CardSet.Basic,
    CardSet.Expert,
    CardSet.JourneyToUnGoro,
    CardSet.KnightsOfTheFrozenThrone,
    CardSet.KoboldsAndCatacombs,
    CardSet.TheWitchwood
];

export const wildCardSets = [
    CardSet.Basic,
    CardSet.GoblinsvsGnomes,
    CardSet.Naxxramas,
    CardSet.BlackrockMountain,
    CardSet.Expert,
    CardSet.LeagueOfExplorers,
    CardSet.TheGrandTournament,
    CardSet.WhispersoftheOldGods,
    CardSet.OneNightInKarazhan,
    CardSet.MeanStreetsOfGadgetzan,
    CardSet.JourneyToUnGoro,
    CardSet.KnightsOfTheFrozenThrone,
    CardSet.KoboldsAndCatacombs,
    CardSet.TheWitchwood,
    CardSet.Reward
];

export const dust = 'dust';
export const latestSet = CardSet.KoboldsAndCatacombs;

const rarityMapping = [-1, 0, 40, 100, 400, 1600],
    cardSetMapping = ['-', 'Basic', 'Classic', 'Blackrock Mountain', 'The Grand Tournament', 'League of Explorers',
        'Whispers of the Old Gods', 'Curse of Naxxramas', 'Goblins vs Gnomes', 'Reward', 'One Night in Karazhan', 'Mean Streets of Gadgetzan',
        'Journey to Un\'Goro', 'Knights of the Frozen Throne', 'Kobolds and Catacombs', 'The Witchwood'
    ];

class HsTypeConverter {
    getEnumLabel(enumerable: { [index: number]: string }, key: number) {
        return key === 0 ? '-' : enumerable[key];
    }

    getCardCost(rarity: CardRarity) {
        return rarityMapping[rarity];
    }

    cardSet(set: number | string): CardSet | string {
        if (typeof set === 'string') {
            let inx = cardSetMapping.indexOf(set.trim());
            if (inx < 0) {
                inx = 0;
            }

            return <CardSet>inx;
        }

        return cardSetMapping[set];
    }

    isStandart(card: { cardSet: CardSet }) {
        return standardCardSets.some(set => card.cardSet === set);
    }

}

export let hsTypeConverter = new HsTypeConverter();
