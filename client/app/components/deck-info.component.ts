import { Component, Input, Output, OnInit, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { DeckUtilsService } from '../services/deck-utils.service';
import { PseudoDeck, Deck, Card, CollectionChangeStatus } from '../../../interfaces/index';
import { Subject, Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
@Component({
    moduleId: module.id,
    selector: 'deck-info',
    templateUrl: 'deck-info.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckInfoComponent implements OnInit, OnDestroy {
    @Input()
    deck: PseudoDeck<Card> | Deck<Card>;
    @Output()
    deckDeleted = new EventEmitter<string>();
    showUserCollection: boolean;
    userCollectionChangeStream = new Subject<boolean>();
    userIgnoreDeckChangeStream = new Subject<boolean>();

    constructor(
        private authService: AuthService,
        private apiService: ApiService,
        public utils: DeckUtilsService
    ) { }


    ngOnInit() {
        if (!this.utils.isDeck(this.deck)) {
            return;
        }

        const deck: Deck<Card> = this.deck;

        this.showUserCollection = deck.id && this.authService.isAuthenticated();
        this.userCollectionChangeStream.
            pipe(
                debounceTime(200),
                switchMap(val => this.apiService.toggleUserDeck(deck.id, val))
            )
            .subscribe((rez: CollectionChangeStatus) => {
                if (rez.success) {
                    deck.userCollection = rez.collection;
                }
                if (deck.deleted || rez.deckDeleted) {
                    this.deckDeleted.emit(deck.id);
                }
            });

        this.userIgnoreDeckChangeStream
            .pipe(
                debounceTime(200),
                switchMap(val => this.apiService.toggleIgnoredDeck(deck.id, val))
            )
            .subscribe((result) => {
                if (result.success) {
                    deck.ignored = result.ignored;
                }
            });
    }
    ngOnDestroy(): void {
        if (this.userCollectionChangeStream) {
            this.userCollectionChangeStream.unsubscribe();
        }
        if (this.userIgnoreDeckChangeStream) {
            this.userIgnoreDeckChangeStream.unsubscribe();
        }
    }

}
