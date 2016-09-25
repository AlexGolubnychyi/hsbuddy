import { Component, OnInit, ChangeDetectionStrategy, Input } from "@angular/core";
import { CardCount } from "../../interfaces/index";

@Component({
    //moduleId: module.id,
    selector: "mana-curve",
    templateUrl: "mana.curve.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManaCurveComponent implements OnInit {
    @Input()
    cardCounts: CardCount[];
    values: number[];
    percentages: number[];

    ngOnInit() {
        this.values = [];
        let maxValue = this.cardCounts.reduce((_maxValue, cardCount) => {
            let manaInx = Math.min(cardCount.card.mana, 7),
                value = this.values[manaInx] = (this.values[manaInx] || 0) + cardCount.count;
            return Math.max(_maxValue, value);
        }, 0);

        this.percentages = this.values.map(value => 100 * value / maxValue);
    }
}