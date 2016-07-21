import { Component, Input, EventEmitter, Output, ChangeDetectionStrategy } from "@angular/core";
import {Card} from "../../interfaces";
import {DeckService} from "../deck.service";

@Component({
    selector: "card",
    templateUrl: "client/components/card.component.html",
    providers: [DeckService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
    @Input()
    card: Card;
    @Output()
    onChanged = new EventEmitter<boolean>();

    constructor(private deckService: DeckService) { }

    onChangeAvailability(newValue: number) {
        this.deckService.changeCardAvailability(this.card.id, newValue).subscribe(() => {
            this.onChanged.emit(true);
        });
    }
}