import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {CardComponent} from "./card.component";
import {Deck} from "../../interfaces/index";

import "../rxjs-operators";
//https://angular.io/docs/ts/latest/tutorial/toh-pt6.html
//https://angular.io/docs/ts/latest/cookbook/component-communication.html#!#child-to-parent
@Component({
    selector: "deck",
    templateUrl: "client/components/deck.component.html",
    directives: [CardComponent],
    providers: [DeckService, AuthService],
})
export class DeckComponent implements OnInit {
    @Input()
    deck: Deck;
    @Output()
    onChanged = new EventEmitter<boolean>();

    showUserCollectionFlag = false;

    constructor(private deckService: DeckService, private authService: AuthService) { }

    ngOnInit() {
        this.showUserCollectionFlag = this.authService.isAuthenticated();
    }

    onCardChanged() {
        this.onChanged.emit(true);
    }

    onChangePersonalCollection(enable: boolean) {
        this.deckService.toggleUserDeck(this.deck.id, enable).subscribe(() => {
            this.deck.userCollection = enable;
        });
    }
}