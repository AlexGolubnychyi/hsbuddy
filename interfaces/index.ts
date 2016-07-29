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
    cardSet?: hstypes.CardSet;
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
    dustNeeded: number;
    collected: boolean;
    cards: Card[];
    userCollection: boolean;
}

export interface DeckQuery {
    userCollection?: boolean | string;
    deckClass?: hstypes.CardClass | string;
    dustNeeded?: number | string;
};

export interface CardGroup {
    name: string;
    class: hstypes.CardClass;
    cards: Card[];
    collapsed?: boolean;
}

export type APICardResult = CardGroup[];
export type APIDeckResult = Deck[];
