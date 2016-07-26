import { Component, OnInit  } from "@angular/core";
import {DeckComponent} from "./deck.component";
import {DeckService} from "../services/deck.service";
import {Deck} from "../../interfaces/index";
import {CardClass} from "../../interfaces/hs-types";
import "../rxjs-operators";

@Component({
    selector: "deck-list",
    templateUrl: "client/components/deck.list.component.html",
    directives: [DeckComponent],
    providers: [DeckService]
})
export class DeckListComponent implements OnInit {
    decks: Deck[] = [];
    deckClasses = (Object.keys(CardClass).filter(key => !isNaN(+key)))
        .map(id => ({ name: CardClass[id], value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    userCollection = localStorage.getItem("hs-fun:userCollection") === "true";
    selectedClass = <CardClass>localStorage.getItem("hs-fun:selectedClass") || CardClass.unknown;
    costRemaining: number = localStorage.getItem("hs-fun:costRemaining") || undefined;

    constructor(private deckService: DeckService) { }
    ngOnInit() {
        this.refreshDecks();
    }

    onDeckChanged() {
        this.refreshDecks();
    }

    onChangeUserCollection(toggle: boolean) {
        this.userCollection = toggle;
        localStorage.setItem("hs-fun:userCollection", <any>toggle);
        this.refreshDecks();
    }
    onChangeCostRemaining(costRemaining: number) {
        if (costRemaining === null){
            costRemaining = void 0;
        }
        this.costRemaining = costRemaining;
        localStorage.setItem("hs-fun:costRemaining", <any>costRemaining);
        this.refreshDecks();
    }
    onChangeClass(selectedClass: CardClass) {
        this.selectedClass = selectedClass;
        localStorage.setItem("hs-fun:selectedClass", <any>selectedClass);
        this.refreshDecks();
    }

    private refreshDecks() {
        this.deckService
            .getDecks({ costRemaining: this.costRemaining, deckClass: this.selectedClass, userCollection: this.userCollection })
            .subscribe(decks => {
                this.decks = decks;
            });
    }
}