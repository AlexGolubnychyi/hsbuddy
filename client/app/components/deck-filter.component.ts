import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CardClass, hsTypeConverter } from '../../../interfaces/hs-types';
import { AuthService } from '../services/auth.service';
import { CardHashService } from '../services/card-hash.service';
import { DeckQuery, OrderBy } from '../../../interfaces/index';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Subject, Observable, Subscriber, combineLatest, race, timer } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { debounce, startWith, filter, tap, map } from 'rxjs/operators';

@Component({
    moduleId: module.id,
    selector: 'deck-filter',
    templateUrl: 'deck-filter.component.html',
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
        orderBy: OrderBy.date,
        userCollection: false,
        latestSet: true,
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
        .map(id => ({ name: hsTypeConverter.cardClass(+id), value: +id }))
        .filter(item => item.value !== CardClass.neutral);
    orderOptions = OrderBy;

    useUserCollectionFilter: boolean;

    ngOnInit() {
        const auth = this.authService.isAuthenticated(),
            filters = auth && localStorage.getItem(this.filterName),
            defaults: DeckQuery = { ...this.emptyValues, ...((filters && JSON.parse(filters)) || {}) };
        this.useUserCollectionFilter = auth;

        const group: { [index: string]: any } = {
            'dustNeeded': [defaults.dustNeeded, Validators.pattern('[0-9]*')],
            'deckClass': defaults.deckClass,
            'orderBy': defaults.orderBy,
            'userCollection': defaults.userCollection,
            'showIgnored': defaults.showIgnored,
            'deckName': defaults.deckName,
            'cardName': defaults.cardName,
            'latestSet': defaults.latestSet
        };

        this.filterForm = this.fb.group(group);

        this.cardNameSource = Observable.create((subscriber: Subscriber<string[]>) => {
            this.ref.markForCheck();
            const value = this.filterForm.get('cardName').value,
                result = this.cardHash.getCardNames(value);
            subscriber.next(result);
        });

        this.filter$ = (
            combineLatest(
                (this.filterForm.valueChanges as Observable<DeckQuery>).pipe(
                    debounce(v => race(
                        this.filterButtonClickStream,
                        this.deckNameKeyStream.pipe(filter((e: KeyboardEvent) => e.keyCode === 13)),
                        this.cardNameKeyStream.pipe(filter((e: KeyboardEvent) => e.keyCode === 13)),
                        timer(1000))),
                    startWith(defaults)),
                this.configService.configChanged.pipe(map(c => c.standart), startWith(this.configService.config.standart))
            ).pipe(
                filter(v => this.filterForm.valid),
                tap(v => localStorage.setItem(this.filterName, JSON.stringify(v[0])))
            )
        );
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
