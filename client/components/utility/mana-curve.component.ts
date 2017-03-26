import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from "@angular/core";
import {trigger, transition, /*state,*/ style, animate} from "@angular/animations";
import { Deck, Card } from "../../../interfaces/index";


@Component({
    moduleId: module.id,
    selector: "mana-curve",
    templateUrl: "mana-curve.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("heightSet", [
            transition("void => *", [
                style({ width: "0%" }),
                animate(".4s ease")
            ])
        ])
    ]
})
export class ManaCurveComponent implements OnChanges {
    @Input()
    deck: Deck<Card>;
    values: number[];
    percentages: number[];


    ngOnChanges(changes: SimpleChanges) {
        this.values = [0, 0, 0, 0, 0, 0, 0, 0];
        let maxValue = this.deck.cards.reduce((_maxValue, cardCount) => {
            let manaInx = Math.min(cardCount.card.mana, 7),
                value = this.values[manaInx] = (this.values[manaInx] || 0) + cardCount.count;
            return Math.max(_maxValue, value);
        }, 0);

        this.percentages = this.values.map(value => 100 * value / maxValue);
    }
}
