import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { Deck, Card } from "../../interfaces/index";
import { CardSet } from "../../interfaces/hs-types";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import "../rxjs-operators";

@Component({
    selector: "deck",
    templateUrl: "client/components/deck.component.html",
})
export class DeckComponent implements OnInit, OnDestroy {
    @Input()
    deck: Deck;
    cards: Card[];
    showUserCollectionFlag = false;
    hideDetails: boolean;
    cardChangedSubscription: Subscription;
    title: string;
    sortOptions = SortOptions;
    filter: CardPipeArg;
    auth: boolean;
    form: FormGroup;

    constructor(private deckService: DeckService, private authService: AuthService, private fb: FormBuilder) {
        this.cardChangedSubscription = this.deckService.cardChanged.subscribe(({cardId, count}) => this.updateDecks(cardId, count));
    }

    ngOnInit() {
        this.showUserCollectionFlag = this.authService.isAuthenticated();
        this.hideDetails = true;
        this.updateTitle();
        this.auth = this.authService.isAuthenticated();
        this.filter = {
            hideAvailable: false,
            sort: SortOptions.classic
        };

        this.form = this.fb.group(<Model>{
            "userCollection": this.deck.userCollection
        });

        (this.form.valueChanges as Observable<Model>)
            .debounceTime(200)
            .switchMap(val => this.deckService.toggleUserDeck(this.deck.id, val.userCollection))
            .subscribe();
    }
    ngOnDestroy() {
        this.cardChangedSubscription.unsubscribe();
    }

    updateTitle() {
        if (this.deck.collected) {
            this.title = `[${this.deck.className}] ${this.deck.name}`;
            return;

        }

        if (this.deck.dustNeeded < this.deck.cost) {
            this.title = `[${this.deck.className}] ${this.deck.name} (${this.deck.cost}, remaining ${this.deck.dustNeeded})`;
            return;
        }

        this.title = `[${this.deck.className}] ${this.deck.name} (${this.deck.cost})`;
    }


    changeAvailability() {
        this.filter = {
            hideAvailable: !this.filter.hideAvailable,
            sort: this.filter.sort
        };
    }
    changeSort(sort: SortOptions) {
        this.filter = {
            hideAvailable: this.filter.hideAvailable,
            sort: sort
        };
    }


    formatDate(date: string) {
        return date.slice(0, 10);
    }

    private updateDecks(cardId: string, newCount: number) {
        let collected = true,
            containsChangedCard = false;
        this.deck.cards.forEach(card => {
            if (card.id === cardId) {
                this.deck.dustNeeded -= card.cost * (Math.min(newCount, card.count) - Math.min(card.numberAvailable, card.count));
                card.numberAvailable = newCount;
                containsChangedCard = true;
            }
            collected = collected && (card.numberAvailable >= card.count || card.cardSet === CardSet.Basic);
        });

        if (containsChangedCard) {
            this.deck.collected = collected;
            this.updateTitle();
        }
    }

}

interface Model {
    userCollection: boolean;
}