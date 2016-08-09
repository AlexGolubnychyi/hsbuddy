import { Pipe, PipeTransform } from "@angular/core";

import {Card} from "../../interfaces";

@Pipe({ name: "cardpipe" })
export class CardPipe implements PipeTransform {
  transform(cards: Card[], options: CardPipeArg) {
    return cards
      .filter(card => !options.hideAvailable || card.numberAvailable < card.count)
      .sort(options.sort === SortOptions.expense ? this.expenseSort : this.classicSort);
  }


  expenseSort(card1: Card, card2: Card) {
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

  classicSort(card1: Card, card2: Card) {
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
}

export enum SortOptions { classic, expense };