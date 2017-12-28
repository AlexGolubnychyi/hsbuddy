import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from "@angular/core";
import { CardClass, hsTypeConverter } from "../../interfaces/hs-types";
import { AuthService } from "../services/auth.service";
import { CardHashService } from "../services/card-hash.service";
import { DeckQuery, OrderBy } from "../../interfaces/index";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { ConfigService } from "../services/config.service";

@Component({
    moduleId: module.id,
    selector: "deck-filter",
    templateUrl: "deck-filter.component.html",
})
export class DeckFilterComponent implements OnInit, OnDestroy {
    @Input()
    filterName: string;

    filterForm: FormGroup;
    filterButtonClickStream = new Subject();
    deckNameKeyStream = new Subject<KeyboardEvent>();
    cardNameKeyStream = new Subject<KeyboardEvent>();
    filter$: Observable<[DeckQuery, boolean]>;
    cardNameSource: Observable<string[]>;
    readonly emptyValues: DeckQuery = {
        deckClass: CardClass.unknown,
        dustNeeded: undefined,
        orderBy: OrderBy.dust,
        userCollection: false,
        latestSet: false,
        showIgnored: false,
        deckName: undefined,
        cardName: undefined
    };

    constructor(
        private authService: AuthService,
        private cardHash: CardHashService,
        private fb: FormBuilder,
        private ref: ChangeDetectorRef,
        private configService: ConfigService) { }

    deckClasses = Object.keys(CardClass)
        .filter(key => !isNaN(+key))
        .map(id => ({ name: hsTypeConverter.getEnumLabel(CardClass, +id), value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    orderOptions = OrderBy;

    useUserCollectionFilter: boolean;

    ngOnInit() {
        let auth = this.authService.isAuthenticated(),
            filters = auth && localStorage.getItem(this.filterName),
            defaults: DeckQuery = { ...this.emptyValues, ...((filters && JSON.parse(filters)) || {}) };
        this.useUserCollectionFilter = auth;

        let group: { [index: string]: any } = {
            "dustNeeded": [defaults.dustNeeded, Validators.pattern("[0-9]*")],
            "deckClass": defaults.deckClass,
            "orderBy": defaults.orderBy,
            "userCollection": defaults.userCollection,
            "showIgnored": defaults.showIgnored,
            "deckName": defaults.deckName,
            "cardName": defaults.cardName,
            "latestSet": defaults.latestSet
        };

        this.filterForm = this.fb.group(group);

        this.cardNameSource = Observable.create((subscriber: Subscriber<string[]>) => {
            this.ref.markForCheck();
            let value = this.filterForm.get("cardName").value,
                result = this.cardHash.getCardNames(value);
            subscriber.next(result);
        });

        this.filter$ = (this.filterForm.valueChanges as Observable<DeckQuery>)
            .debounce(v => Observable.race(
                this.filterButtonClickStream,
                this.deckNameKeyStream.filter((e: KeyboardEvent) => e.keyCode === 13),
                this.cardNameKeyStream.filter((e: KeyboardEvent) => e.keyCode === 13),
                Observable.timer(1000)))
            .startWith(defaults)
            .combineLatest(this.configService.configChanged.map(c => c.standart).startWith(this.configService.config.standart))
            .filter(v => this.filterForm.valid)
            .do(v => localStorage.setItem(this.filterName, JSON.stringify(v[0])));
    }

    ngOnDestroy() {
        this.filterButtonClickStream.unsubscribe();
        this.deckNameKeyStream.unsubscribe();
        this.cardNameKeyStream.unsubscribe();
    }

    resetFilter() {
        this.filterForm.reset(this.emptyValues);
        this.filterButtonClickStream.next();
    }
    cardNameOnSelect() {
        this.filterButtonClickStream.next();
    }
}
