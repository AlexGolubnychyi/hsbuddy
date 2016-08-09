import { Component, OnInit, Input } from "@angular/core";
import {CardClass} from "../../interfaces/hs-types";
import {AuthService} from "../services/auth.service";
import {DeckQuery, OrderBy} from "../../interfaces/index";
import { FormGroup, FormControl, Validators, REACTIVE_FORM_DIRECTIVES   }  from "@angular/forms";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

@Component({
    selector: "deck-filter",
    templateUrl: "client/components/deck.filter.component.html",
    directives: [REACTIVE_FORM_DIRECTIVES]
})
export class DeckFilterComponent implements OnInit {
    @Input()
    filterName: string;

    filterForm: FormGroup;
    filterButtonClickStream = new Subject();
    filter$: Observable<DeckQuery>;

    constructor(private authService: AuthService) { }

    deckClasses = Object.keys(CardClass)
        .filter(key => !isNaN(+key))
        .map(id => ({ name: CardClass[id], value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    orderOptions = OrderBy;

    useUserCollectionFilter: boolean;

    ngOnInit() {
        let auth = this.authService.isAuthenticated(),
            filters = auth && localStorage.getItem(this.filterName),
            defaults: DeckQuery = (filters && JSON.parse(filters)) || {
                deckClass: CardClass.unknown,
                dustNeeded: undefined,
                orderBy: OrderBy.dust,
                userCollection: undefined
            };
        this.useUserCollectionFilter = auth;


        let group: { [index: string]: FormControl } = {
            "dustNeeded": new FormControl(defaults.dustNeeded, Validators.pattern("[0-9]*")),
            "deckClass": new FormControl(defaults.deckClass),
            "orderBy": new FormControl(defaults.orderBy),
        };

        if (auth) {
            group["userCollection"] = new FormControl(defaults && defaults.userCollection);
        }

        this.filterForm = new FormGroup(group);

        this.filter$ = this.filterForm
            .valueChanges
            .debounce(v => Observable.race(this.filterButtonClickStream, Observable.timer(2000)))
            .startWith(defaults)
            .filter(v => this.filterForm.valid)
            .do(v => localStorage.setItem(this.filterName, JSON.stringify(v)));
    }
}
