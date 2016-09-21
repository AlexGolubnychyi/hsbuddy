import { Pipe, PipeTransform } from "@angular/core";

import { CardCount } from "../../interfaces";
import { CardRarity } from "../../interfaces/hs-types";

@Pipe({ name: "cardpipe" })
export class CardPipe implements PipeTransform {
  transform(cards: CardCount[], options: CardPipeArg) {
    let filtered = cards.filter(c => this.filter(c, options));
    if (options.sort === SortOptions.keepOrder) {
      return filtered;
    }
    return filtered.sort(options.sort === SortOptions.expense ? this.expenseSort : this.classicSort);
  }

  private filter(cardCount: CardCount, options: CardPipeArg) {
    if (options.hideAvailable && cardCount.card.numberAvailable >= cardCount.count) {
      return false;
    }

    if (options.rarity && cardCount.card.rarity !== options.rarity) {
      return false;
    }

    return options.mana === 0 || (Math.pow(2, Math.min(cardCount.card.mana, 7)) & options.mana) > 0;
  }

  private expenseSort(cardCount1: CardCount, cardCount2: CardCount) {
    let card1 = cardCount1.card,
      card2 = cardCount2.card,
      diff = card1.rarity - card2.rarity;

    if (diff) {
      return diff;
    }

    diff = card1.mana - card2.mana;
    if (diff) {
      return diff;
    }

    return card1.name > card2.name ? 1 : -1;
  }

  private classicSort(cardCount1: CardCount, cardCount2: CardCount) {
    let card1 = cardCount1.card,
      card2 = cardCount2.card,
      diff = card2.class - card1.class;

    if (diff) {
      return diff;
    }

    diff = card1.mana - card2.mana;
    if (diff) {
      return diff;
    }
    return card1.name > card2.name ? 1 : -1;
  }
}

export interface CardPipeArg {
  sort: SortOptions;
  hideAvailable: boolean;
  mana: number;
  rarity?: CardRarity;
}

export enum SortOptions { classic, expense, keepOrder };