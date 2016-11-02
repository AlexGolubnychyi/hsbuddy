import { Component, Input, OnChanges, ChangeDetectionStrategy } from "@angular/core";
import { Card, CardCount } from "../../interfaces/index";
import * as hstypes from "../../interfaces/hs-types";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { Config } from "../services/config.service";

@Component({
    moduleId: module.id,
    selector: "card-list",
    templateUrl: "card-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardListComponent implements OnChanges {

    @Input()
    cards: CardCount<Card>[];
    @Input()
    float = false;
    @Input()
    slitCardList = false;
    @Input()
    filter: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.expense,
        mana: 0
    };
    @Input()
    config: Config;
    cardList1: CardCount<Card>[] = [];
    cardList2: CardCount<Card>[] = [];

    ngOnChanges(changes) {
        this.refresh();
    }

    refresh() {
        if (this.slitCardList) {
            this.cardList1 = this.cards.filter(c => c.card.class > hstypes.CardClass.neutral);
            this.cardList2 = this.cards.filter(c => c.card.class === hstypes.CardClass.neutral);
        }
    }
}