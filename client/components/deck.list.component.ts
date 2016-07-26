import { Component, OnInit  } from "@angular/core";
import {DeckComponent} from "./deck.component";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {Deck} from "../../interfaces/index";
import {CardClass} from "../../interfaces/hs-types";
import "../rxjs-operators";

@Component({
    selector: "deck-list",
    templateUrl: "client/components/deck.list.component.html",
    directives: [DeckComponent],
    providers: [DeckService, AuthService],
})
export class DeckListComponent implements OnInit {
    decks: Deck[] = [];
    deckClasses = (Object.keys(CardClass).filter(key => !isNaN(+key)))
        .map(id => ({ name: CardClass[id], value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    userCollection: boolean;
    selectedClass: CardClass;
    costRemaining: number;
    useUserCollectionFilter: boolean;

    constructor(private deckService: DeckService, private authService: AuthService) { }
    ngOnInit() {
        let filters = localStorage.getItem("hs-fun:filters");
        this.useUserCollectionFilter = this.authService.isAuthenticated()
        let useLocalStorage = !!filters && this.authService.isAuthenticated();

        [this.userCollection, this.selectedClass, this.costRemaining] = useLocalStorage
                ? JSON.parse(filters)
                : [false, CardClass.unknown, void 0];

        this.refreshDecks();
    }

    onDeckChanged() {
        this.refreshDecks();
    }

    applyFilters() {
        if (this.authService.isAuthenticated()) {
            localStorage.setItem("hs-fun:filters", JSON.stringify([this.userCollection, this.selectedClass, this.costRemaining]));
        }

        this.refreshDecks();
    }

    private refreshDecks() {
        if (this.costRemaining === null) {
            this.costRemaining = void 0;
        }

        this.deckService
            .getDecks({ costRemaining: this.costRemaining, deckClass: this.selectedClass, userCollection: this.userCollection })
            .subscribe(decks => {
                this.decks = decks;
            });
    }
}