export interface Card {
    id: string;
    name: string;
    description: string;
    flavorText: string;
    img: string;
    class: string;
    type: string;
    rarity: string;
    set?: string;
    race?: string;
    url: string;
    cost: number;
    mana: number;
    attack?: number;
    health?: number;
    numberAvailable?: number;
    count: number;
}

export interface Deck {
    name: string;
    url: string;
    cost: number;
    costApprox: boolean;
    costReduction: number;
    cards: Card[];
}
