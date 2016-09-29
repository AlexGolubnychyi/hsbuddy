import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { ApiService, CardChanged } from "../services/api.service";
import { AuthService } from "../services/auth.service";
import { ConfigService } from "../services/config.service";
import { Deck, Card } from "../../interfaces/index";
import { DeckFilterComponent } from "./deck-filter.component";
import { BaseComponent } from "./base.component";
@Component({
    //moduleId: module.id,
    selector: "deck-list",
    templateUrl: "deck-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class DeckListComponent extends BaseComponent implements AfterViewInit, OnInit, OnDestroy {
    decks: Deck<Card>[] = [];
    loading: boolean = true;

    @ViewChild(DeckFilterComponent) filter: DeckFilterComponent;

    constructor(
        deckService: ApiService,
        configService: ConfigService,
        private authService: AuthService,
        private ref: ChangeDetectorRef
    ) { super(configService, deckService); }

    ngAfterViewInit() {
        this.filter.filter$
            .do(() => this.loading = true)
            .switchMap<Deck<Card>[]>(params => this.deckService.getDecks(params))
            .subscribe(decks => {
                this.ref.markForCheck();
                this.decks = decks;
                this.loading = false;

            });
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngDestroy() {
        super.ngOnDestroy();
    }

    deckIdentity(index: number, deck: Deck<Card>) {
        return deck.id;
    }

    onDeleteDeck(deckId: string) {
        this.decks = this.decks.filter(d => d.id !== deckId);
    }

    onCardChanged(cardChanged: CardChanged) {
        this.ref.markForCheck();
        this.decks = this.decks.map(deck => {
            if (deck.cards.some(c => c.card.id === cardChanged.cardId)) {
                return Object.assign({}, deck); //trigger changed deck redraw
            }
            return deck;
        });
    }

    onConfigChanged() {
        this.ref.markForCheck();
    }
}