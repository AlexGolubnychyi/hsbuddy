import * as hstypes from "./hs-types";

export enum OrderBy {date, dust};

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
    dateAdded: Date;
    class: hstypes.CardClass;
    className: string;
    cost: number;
    dustNeeded: number;
    collected: boolean;
    cards: Card[];
    userCollection: boolean;
    userId: string;
}

export interface CardMissing {
    card: Card;
    decks: [
        {
            id: string,
            name: string,
            count: number,
            url: string,
            cost: number;
            dustNeeded: number;
            className: string;
        }
    ];
}

export interface DeckQuery {
    userCollection?: boolean | string;
    deckClass?: hstypes.CardClass | string;
    dustNeeded?: number | string;
    orderBy: OrderBy;
};

export interface CardGroup {
    name: string;
    class: hstypes.CardClass;
    cards: Card[];
    collapsed?: boolean;
}

export interface CardLibraryInfo {
    stats: { [index: string]: [number, number] };
    groups: CardGroup[];
}