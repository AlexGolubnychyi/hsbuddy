import * as hstypes from "./hs-types";

export enum OrderBy { date, dust };

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
    className: string;
    cost: number;
    dustNeeded: number;
    collected: boolean;
    dateAdded: Date;
    class: hstypes.CardClass;
    cards: Card[];
    userCollection: boolean;
    userId: string;
    deleted?: boolean;
    revisions?: ({
        number: number;
        dateAdded: Date;
        userId: string;
    } & Diff)[];
}

export interface DeckDiff extends Diff {
    deck: Deck;
}

export interface Diff {
    diff: number;
    cardAddition: Card[];
    cardRemoval: Card[];
}

export interface DeckChange {
    name: string;
    date: string;
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

export interface AuthResult {
    success: boolean;
    error?: string;
}

export interface Result {
    success: boolean;
    error?: string;
}

export enum ParseStatus {
    unknown, success, upgrade, duplicate, fail
}

export interface ParseResult {
    deckId?: string;
    status: ParseStatus;
    url: string;
    error?: string;
}

export interface CollectionChangeStatus {
    success: boolean;
    deckDeleted?: boolean;
}
