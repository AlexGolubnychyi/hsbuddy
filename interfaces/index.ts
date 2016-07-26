import * as hstypes from "./hs-types";

export interface Card {
    id: string;
    name: string;
    description: string;
    flavorText: string;
    img: string;
    class: hstypes.CardClass;
    className: string;
    type: hstypes.CardType;
    rarity: hstypes.CardRarity;
    set?: hstypes.CardSet;
    setName?: string;
    race?: hstypes.CardRace;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
    numberAvailable?: number;
    count: number;
}

export interface Deck {
    id: string;
    name: string;
    url: string;
    class: hstypes.CardClass;
    className: string;
    cost: number;
    costApprox: boolean;
    costRemaining: number;
    collected: boolean;
    cards: Card[];
    userCollection: boolean;
}

export interface DeckQuery {
    userCollection: any;
    deckClass: any;
    costRemaining: any;
};

export var deckQuery: DeckQuery = {
    userCollection: "userCollection",
    deckClass: "deckClass",
    costRemaining: "costRemaining"
};

