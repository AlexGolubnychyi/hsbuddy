import * as hsTypes from "../../interfaces/hs-types";

export interface DBAvailability {
    userId: string;
    cardId: string;
    count: number;
}
export interface DBUser {
    userId: string;
    hash: string;
}

export interface DBDeck {
    hash: string;
    name: string;
    url: string;
    class: hsTypes.CardClass;
    cost: number;
    costApprox: boolean;
    cards: { [index: string]: number };
}

export interface DBCard {
    id: string;
    name: string;
    description: string;
    flavorText: string;
    img: string;
    class: hsTypes.CardClass;
    type: hsTypes.CardType;
    rarity: hsTypes.CardRarity;
    set: hsTypes.CardSet;
    race: hsTypes.CardRace;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
}