import { Component, ChangeDetectionStrategy, Input, trigger, transition, style, animate } from "@angular/core";

@Component({
    //moduleId: module.id,
    selector: "pillow-chart",
    templateUrl: "pillow.chart.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("widthSet", [
            transition("void => *", [
                style({ width: "0%" }),
                animate(".4s ease")
            ])
        ])
    ]
})
export class PillowChartComponent {
    @Input()
    data: PillowChartData;
}

export interface PillowChartData {
    value: number;
    maxValue: number;
    legend?: string;
    showValues?: boolean;
}