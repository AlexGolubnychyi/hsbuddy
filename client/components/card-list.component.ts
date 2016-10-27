import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { Card, CardCount } from "../../interfaces/index";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { Config } from "../services/config.service";

@Component({
    moduleId: module.id,
    selector: "card-list",
    templateUrl: "card-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardListComponent {
    @Input()
    cards: CardCount<Card>[];
    @Input()
    float = false;
    @Input()
    filter: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.expense,
        mana: 0
    };
    @Input()
    config: Config;


}