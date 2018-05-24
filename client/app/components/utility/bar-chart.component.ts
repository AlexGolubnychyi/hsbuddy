import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    moduleId: module.id,
    selector: 'bar-chart',
    templateUrl: 'bar-chart.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('heightSet', [
            transition('void => *', [
                style({ width: '0%' }),
                animate('0.4s ease')
            ])
        ])
    ]
})
export class BarChartComponent implements OnChanges {
    @Input()
    data: BarChartData;

    percentages: number[];
    indexes: number[];

    ngOnChanges(changes: SimpleChanges) {
        this.data.image = this.data.image || <any>{};
        this.percentages = this.data.values.map(v => 100 * v.value / v.maxValue);
        this.indexes = this.data.values.map((v, inx) => inx);
    }

    formatValue(index: number) {
        let { value, maxValue }: { value: number | string, maxValue: number | string } = this.data.values[index];
        if (value > 999) {
            value = `${Math.round(value / 100) / 10}k`;
            maxValue = `${Math.round(maxValue / 100) / 10}k`;
        }
        return this.data.valueStyle === 'value' ? value : `${value}/${maxValue}`;
    }

    getTitle(index: number) {
        const val = this.data.values[index];
        return `${val.value} / ${val.maxValue}`;
    }

    getFullTitle(index: number) {
        const val = this.data.values[index];
        return `${val.legend ? val.legend + ': ' : ''} ${val.value} / ${val.maxValue}`;
    }
}

interface BarChartValue {
    value: number;
    maxValue: number;
    barColor?: string;
    legend?: string;
    imageSrc?: string;
}

export interface BarChartData {
    values: BarChartValue[];
    valueStyle?: 'value' | 'value/max';
    image?: {
        offsetX?: number;
        offsetY?: number;
        src: string;
        backSize?: number;
    };
}
