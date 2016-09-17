import { Pipe, PipeTransform } from "@angular/core";

import { Card } from "../../interfaces";
import { CardRarity } from "../../interfaces/hs-types";

@Pipe({ name: "cardpipe" })
export class CardPipe implements PipeTransform {
  transform(cards: Card[], options: CardPipeArg) {
    let filtered = cards.filter(c => this.filter(c, options));
    if (options.sort === SortOptions.keepOrder) {
      return filtered;
    }
    return filtered.sort(options.sort === SortOptions.expense ? this.expenseSort : this.classicSort);
  }

  private filter(card: Card, options: CardPipeArg) {
    if (options.hideAvailable && card.numberAvailable >= card.count) {
      return false;
    }

    if (options.rarity && card.rarity !== options.rarity) {
      return false;
    }

    if (typeof options.mana !== "undefined" && card.mana !== options.mana) {
      return options.mana === 7 && card.mana > 7;
    }

    return true;
  }

  private expenseSort(card1: Card, card2: Card) {
    let diff = card1.rarity - card2.rarity;
    if (diff) {
      return diff;
    }

    diff = card1.mana - card2.mana;
    if (diff) {
      return diff;
    }

    return card1.name > card2.name ? 1 : -1;
  }

  private classicSort(card1: Card, card2: Card) {
    let diff = card2.class - card1.class;
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
  mana?: number;
  rarity?: CardRarity;
}

export enum SortOptions { classic, expense, keepOrder };