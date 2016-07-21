import { Component, Input } from "@angular/core";
import {Card} from "../interfaces";

@Component({
    selector: "card",
    templateUrl: "client/card.component.html"
})
export class CardComponent {
    @Input()
    card: Card;

    onChangeAvailability(newValue: number) {
        console.log(`changed to ${newValue}`);
        this.card.numberAvailable = newValue;
    }
}