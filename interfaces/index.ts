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
}

export interface Deck<T extends string | Card> {
    id: string;
    name: string;
    url: string;
    className: string;
    cost: number;
    dustNeeded: number;
    collected: boolean;
    dateAdded: Date;
    class: hstypes.CardClass;
    cards: CardCount<T>[];
    userCollection: boolean;
    userId: string;
    deleted?: boolean;
    revisions?: ({
        number: number;
        dateAdded: Date;
        userId: string;
        cards: CardCount<T>[];
        collected?: boolean;
    } & Diff<T>)[];
}

export interface DeckDiff<T extends string | Card> extends Diff<T> {
    deck: Deck<T>;
}


export interface Diff<T extends string | Card> {
    diff: number;
    cardAddition: CardCount<T>[];
    cardRemoval: CardCount<T>[];
}

export interface CardCount<T extends Card | string> {
    card: T;
    count: number;
}

export interface DeckChange {
    name: string;
    date: string;
}

export interface DeckResult<T> {
    result: T;
    cardHash: CardHash;
}

export interface CardHash {
    [index: string]: Card;
}

export interface CardMissing<T extends string | Card> {
    cardCount: CardCount<T>;
    decks: [{
        id: string;
        name: string;
        count: number;
        url: string;
        cost: number;
        dustNeeded: number;
        className: string;
    }];
}

export interface DeckQuery {
    userCollection?: boolean | string;
    deckClass?: hstypes.CardClass | string;
    dustNeeded?: number | string;
    orderBy: OrderBy;
    deckName?: string;
};

export interface CardGroup<T extends string | Card> {
    name: string;
    class: hstypes.CardClass;
    cards: CardCount<T>[];
    collapsed?: boolean;
}

export interface CardLibraryInfo<T extends string | Card> {
    stats: { [index: string]: [number, number] };
    groups: CardGroup<T>[];
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
