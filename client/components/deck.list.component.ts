import { Component, OnInit  } from "@angular/core";
import {DeckComponent} from "./deck.component";
import {DeckService} from "../services/deck.service";
import {AuthService} from "../services/auth.service";
import {Deck, DeckQuery} from "../../interfaces/index";
import {CardClass} from "../../interfaces/hs-types";
import "../rxjs-operators";

const localStorageKey = "hs-fun:filters";

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
    dustNeeded: number;
    useUserCollectionFilter: boolean;
    loading: boolean;

    constructor(private deckService: DeckService, private authService: AuthService) { }
    ngOnInit() {
        let filters = localStorage.getItem(localStorageKey);
        this.useUserCollectionFilter = this.authService.isAuthenticated();
        let useLocalStorage = !!filters && this.authService.isAuthenticated();

        [this.userCollection, this.selectedClass, this.dustNeeded] = useLocalStorage
            ? JSON.parse(filters)
            : [false, CardClass.unknown, null];

        this.refreshDecks();
    }

    onDeckChanged() {
        this.refreshDecks();
    }

    applyFilters() {
        if (this.authService.isAuthenticated()) {
            localStorage.setItem(localStorageKey, JSON.stringify([this.userCollection, this.selectedClass, this.dustNeeded]));
        }

        this.refreshDecks();
    }

    private refreshDecks() {
        let params: DeckQuery = {};

        if (typeof this.dustNeeded === "number") {
            params.dustNeeded = this.dustNeeded;
        }
        if (this.selectedClass > 0) {
            params.deckClass = this.selectedClass;
        }

        if (this.userCollection) {
            params.userCollection = true;
        }
        this.loading = true;
        this.deckService
            .getDecks(params)
            .subscribe(decks => {
                this.decks = decks;
                this.loading = false;
            });
    }
}