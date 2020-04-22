import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService, CardChanged } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ConfigService, cardStyles } from '../services/config.service';
import { CardHashService } from '../services/card-hash.service';
import * as contracts from '../../../interfaces/index';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DeckUtilsService } from '../services/deck-utils.service';
import { of } from 'rxjs';
import { DeckComponent } from './deck.component';
import { CardPipeArg, SortOptions } from '../pipes/card.pipe';
import { BaseComponent } from './base.component';
import { map, switchMap, timeout, catchError, tap, filter } from 'rxjs/operators';


@Component({
    moduleId: module.id,
    selector: 'selector',
    templateUrl: 'deck-detail.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckDetailComponent extends BaseComponent implements OnInit {
    deck: contracts.Deck<contracts.Card>;
    similarDecks: contracts.DeckDiff<contracts.Card>[];
    loading: boolean;
    loadingSimilarDecks: boolean;
    form: FormGroup;
    edit = false;
    editError: string;
    upgrading = false;
    upgradeUrl = '';
    confirmDeletion = false;
    cardFilterOpts: CardPipeArg = {
        hideAvailable: false,
        sort: SortOptions.classic,
        mana: 0
    };

    showRevision = false;

    @ViewChild(DeckComponent) deckComponent: DeckComponent;

    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService,
        private fb: FormBuilder,
        private ref: ChangeDetectorRef
    ) { super(configService, apiService); }

    ngOnInit() {
        super.ngOnInit();
        this.loading = true;

        this.form = this.fb.group({
            name: ['', Validators.required],
            date: ['', Validators.required],
            url: ['']
        });

        this.route.params
            .pipe(
                map(params => params['id'] as string),
                switchMap(id => this.apiService.getDeck(id))
            )
            .subscribe(deck => {
                if (!deck) {
                    this.router.navigateByUrl('/');
                }
                this.deck = deck;
                this.cancelEdit();
                this.loading = false;
                this.similarDecks = null;
                if (this.deckComponent) {
                    this.deckComponent.hideDetails = false;
                }
                this.setDefaults();
                this.ref.markForCheck();
            });
    }

    toggleSimilarDecks() {
        if (this.similarDecks) {
            this.similarDecks = null;
            return;
        }
        this.loadingSimilarDecks = true;

        this.apiService.getSimilar(this.deck.id, this.config.standart)
            .pipe(
                timeout(5000),
                catchError(() => of(null))
            )
            .subscribe(similarDecks => {
                this.ref.markForCheck();
                this.loadingSimilarDecks = false;
                if (similarDecks) {
                    this.similarDecks = similarDecks;
                }
            });
    }

    startEdit() {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.edit = true;
    }

    change() {
        this.apiService.setDescription(this.deck.id, <contracts.DeckChange>this.form.value).subscribe(result => {
            this.ref.markForCheck();
            if (result) {

                this.deck.name = result.name;
                this.deck.dateAdded = result.date;
                this.deck.url = result.url;
                this.cancelEdit();
                return;
            }
            this.editError = 'failed to change deck description';
        });
    }
    delete() {
        if (!this.confirmDeletion) {
            this.confirmDeletion = true;
            return;
        }

        this.loading = true;
        (this.deck.userCollection
            ? this.apiService.toggleUserDeck(this.deck.id, false)
            : of({ collection: false, success: true }))
            .pipe(
                tap<contracts.CollectionChangeStatus>(result => this.loading = result.success),
                filter(result => result.success),
                switchMap(() => this.apiService.deleteDeck(this.deck.id))
            )
            .subscribe(result => {
                this.ref.markForCheck();
                this.loading = false;
                if (result) {
                    this.router.navigateByUrl('/');
                    return;
                }

                this.editError = 'failed to delete';
            });
    }

    onDeleteDeck(deckId: string) {
        this.router.navigateByUrl('/');
    }

    onSimilarDeckDeleted(deckId: string) {
        // do something I guess..
    }

    cancelEdit() {
        this.editError = null;
        this.setDefaults();
        this.edit = false;
        this.confirmDeletion = false;
        this.upgrading = false;
    }

    textOnlyMode() {
        return this.config.cardStyle === cardStyles.textOnly;
    }

    upgrade() {
        if (!this.upgrading) {
            this.upgrading = true;
            return;
        }
        this.editError = '';
        this.loading = true;
        this.apiService
            .upgradeDeck({ deckId: this.deck.id, url: this.upgradeUrl })
            .subscribe(result => {
                if (result.status !== contracts.ParseStatus.success) {
                    const failed = result.status === contracts.ParseStatus.fail;
                    this.editError = `failed to upgrade: ${failed ? result.error : contracts.ParseStatus[result.status]}`;
                    this.ref.markForCheck();
                    this.loading = false;
                    return null;
                }
                this.router.navigateByUrl(`/deck/${result.deckId}`);
            });
    }

    revIdentity(index: number, rev: contracts.DeckRevision<contracts.Card>) {
        return rev.number;
    }

    getDeckName() {
        if (this.config.standart) {
            return this.deck.name;
        }
        return `[${this.deck.standart ? 'standard' : 'wild'}] ${this.deck.name}`;
    }

    protected onCardChanged(cardChanged: CardChanged) {
        this.deck = this.utils.updateRef(this.deck);
        if (this.similarDecks) {
            this.similarDecks.forEach(sd => this.utils.updateDeckDiffStats(sd));
        }
        this.ref.markForCheck();
    }

    protected onConfigChanged() {
        // trigger global refresh
        this.deck = this.utils.updateRef(this.deck);
        if (this.similarDecks) {
            this.similarDecks.forEach(sd => sd.deck = this.utils.updateRef(sd.deck));
        }
        if (this.deck.revisions) {
            this.deck.revisions = this.deck.revisions.map(rev => this.utils.updateRef(rev));
        }
        this.ref.markForCheck();
    }

    private setDefaults() {
        let date: Date | string = this.deck.dateAdded;
        if (date) {
            if (typeof date === 'string') {
                date = (this.deck.dateAdded + '').split('T')[0];
            }
        }
        this.form.reset({
            name: this.deck.name,
            date
        });
        this.upgradeUrl = '';
    }


}
