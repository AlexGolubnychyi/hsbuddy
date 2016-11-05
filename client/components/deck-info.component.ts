import { Component, Input, Output, OnInit, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { ApiService } from "../services/api.service";
import { DeckUtilsService } from "../services/deck-utils.service";
import { PseudoDeck, Deck, Card, CollectionChangeStatus } from "../../interfaces/index";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import "../rxjs-operators";
@Component({
    moduleId: module.id,
    selector: "deck-info",
    templateUrl: "deck-info.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckInfoComponent implements OnInit {
    @Input()
    deck: PseudoDeck<Card> | Deck<Card>;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    showUserCollection: boolean;
    userCollectionChangeStream = new Subject();

    constructor(
        private authService: AuthService,
        private apiService: ApiService,
        public utils: DeckUtilsService
    ) { }


    ngOnInit() {
        if (!this.utils.isDeck(this.deck)) {
            return;
        }

        let deck: Deck<Card> = this.deck;

        this.showUserCollection = deck.id && this.authService.isAuthenticated();
        (this.userCollectionChangeStream as Observable<boolean>)
            .debounceTime(200)
            .switchMap(val => this.apiService.toggleUserDeck(deck.id, val))
            .subscribe((rez: CollectionChangeStatus) => {
                if (rez.success) {
                    deck.userCollection = rez.collection;
                }
                if (deck.deleted || rez.deckDeleted) {
                    this.onDeleteDeck.emit(deck.id);
                }
            });
    }

}