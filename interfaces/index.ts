import * as hstypes from "./hs-types";

export enum OrderBy { date, dust };

export interface Card {
    id: string;

    dbfId: number;
    officialId: string;
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

export interface PseudoDeck<T extends string | Card> {
    url: string;
    importCode: string;
    dateAdded: Date | string;
    userId: string;
    class: hstypes.CardClass;
    className: string;
    cost: number;
    dustNeeded: number;
    collected: boolean;
    cards: CardCount<T>[];
}

export interface Deck<T extends string | Card> extends PseudoDeck<T> {
    id: string;
    name: string;
    revisions?: DeckRevision<T>[];
    userCollection?: boolean;
    ignored?: boolean;
    deleted?: boolean;
    standart: boolean;
}

export interface DeckRevision<T extends string | Card> extends PseudoDeck<T>, Diff<T> {
    number: number;
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
    url?: string;
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
    showIgnored?: boolean | string;
    deckClass?: hstypes.CardClass | string;
    dustNeeded?: number | string;
    orderBy: OrderBy;
    deckName?: string;
    cardName?: string;
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
    token?: any;
}

export interface TokenPayload {
    username: string;
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
    parserName: string;
}

export interface CollectionChangeStatus {
    collection: boolean;
    success: boolean;
    deckDeleted?: boolean;
}

export interface IgnoredChangeStatus {
    ignored: boolean;
    success: boolean;
}
