import { Component, OnInit, Input, Output, EventEmitter  } from "@angular/core";
import {CardClass} from "../../interfaces/hs-types";
import {AuthService} from "../services/auth.service";
import {DeckQuery} from "../../interfaces/index";

@Component({
    selector: "deck-filter",
    templateUrl: "client/components/deck.filter.component.html",
})
export class DeckFilterComponent implements OnInit {
    @Input()
    filterName: string;
    @Output()
    filterChanged = new EventEmitter<DeckQuery>();

    constructor(private authService: AuthService) { }

    deckClasses = Object.keys(CardClass)
        .filter(key => !isNaN(+key))
        .map(id => ({ name: CardClass[id], value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    userCollection: boolean;
    selectedClass: CardClass;
    dustNeeded: number;
    useUserCollectionFilter: boolean;

    ngOnInit() {
        let filters = localStorage.getItem(this.filterName);
        this.useUserCollectionFilter = this.authService.isAuthenticated();
        let useLocalStorage = !!filters && this.authService.isAuthenticated();

        [this.userCollection, this.selectedClass, this.dustNeeded] = useLocalStorage
            ? JSON.parse(filters)
            : [false, CardClass.unknown, null];

        this.notify();
    }

    applyFilters() {
        if (this.authService.isAuthenticated()) {
            localStorage.setItem(this.filterName, JSON.stringify([this.userCollection, this.selectedClass, this.dustNeeded]));
        }
        this.notify();
    }

    private notify() {
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

        this.filterChanged.emit(params);
    }
}
