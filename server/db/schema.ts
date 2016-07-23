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
    name: string;
    url: string;
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
    class: string;
    type: string;
    rarity: string;
    set: string;
    race: string;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
}