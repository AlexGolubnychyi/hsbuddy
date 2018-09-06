
import { throwError as observableThrowError, Observable, Subject, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as contracts from '../../../interfaces/index';
import { CardHashService } from './card-hash.service';
import { map, catchError, tap } from 'rxjs/operators';

const enc = encodeURIComponent;

@Injectable()
export class ApiService {
    public cardChanged: Subject<CardChanged>;
    constructor(private http: HttpClient, private cardHashService: CardHashService) {
        this.cardChanged = new Subject<CardChanged>();
    }

    getDecks(standart: boolean, options?: contracts.DeckQuery): Observable<contracts.Deck<contracts.Card>[]> {
        const url = this.withParams('api/deck', { ...options, standart });

        return this.http.get(url)
            .pipe(
                map((deckResult: contracts.DeckResult<contracts.Deck<string>[]>) => {
                    this.cardHashService.feedHash(deckResult.cardHash);
                    return deckResult.result.map(deck => this.cardHashService.inflateDeck(deck));
                }),
                catchError(this.handleError)
            );
    }

    getDeck(deckId: string): Observable<contracts.Deck<contracts.Card>> {
        const url = `api/deck/${deckId}`;

        return this.http.get<contracts.DeckResult<contracts.Deck<string>>>(url)
            .pipe(
                map(deckResult => {
                    this.cardHashService.feedHash(deckResult.cardHash);
                    return this.cardHashService.inflateDeck(deckResult.result);
                }),
                catchError(this.handleError)
            );
    }

    getSimilar(deckId: string, standart: boolean): Observable<contracts.DeckDiff<contracts.Card>[]> {
        const url = this.withParams(`api/deck/${deckId}/similar`, { standart });

        return this.http.get<contracts.DeckResult<contracts.DeckDiff<string>[]>>(url)
            .pipe(
                map(deckResult => {
                    this.cardHashService.feedHash(deckResult.cardHash);
                    return deckResult.result.map(deck => this.cardHashService.inflateDiff(deck));
                }),
                catchError(this.handleError)
            );
    }

    setDescription(deckId: string, description: contracts.DeckChange) {
        const url = `api/deck/${deckId}`;

        return this.http.post<contracts.DeckChange>(url, description)
            .pipe(catchError(() => of(null)));
    }

    getCardLibraryInfo(standart: boolean): Observable<contracts.CardLibraryInfo<contracts.Card>> {
        const url = this.withParams('api/card/library', { standart });
        return this.http.get(url)
            .pipe(
                map((deckResult: contracts.DeckResult<contracts.CardLibraryInfo<contracts.Card | string>>) => { // LAZY INFLATE
                    this.cardHashService.feedHash(deckResult.cardHash);
                    deckResult.result.groups.forEach(group => {
                        group.cards.forEach(c => c.card = this.cardHashService.getCard(c.card as string));
                    });
                    return deckResult.result as contracts.CardLibraryInfo<contracts.Card>;
                }),
                catchError(this.handleError)
            );
    }

    getMissingCards(standart: boolean, options?: contracts.DeckQuery): Observable<contracts.CardMissing<contracts.Card>[]> {
        const url = this.withParams('api/card/missing', { ...options, standart });
        return this.http.get(url)
            .pipe(
                map((deckResult: contracts.DeckResult<contracts.CardMissing<contracts.Card | string>[]>) => { // LAZY INFLATE
                    this.cardHashService.feedHash(deckResult.cardHash);
                    deckResult.result.forEach(cardMissing => cardMissing.cardCount.card = this.cardHashService.getCard(cardMissing.cardCount.card as string));
                    return deckResult.result as contracts.CardMissing<contracts.Card>[];
                }),
                catchError(this.handleError)
            );
    }

    changeCardAvailability(cardId: string, cardAvail: number, prevCardAvail: number) {
        return this.http.get(`api/card/changenumber/${enc(cardId)}/${cardAvail}`)
            .pipe(
                tap(resp => {
                    this.cardHashService.updateAvailability(cardId, cardAvail);
                    this.cardChanged.next({ cardId, cardAvail, prevCardAvail });
                }),
                map(resp => true),
                catchError(this.handleError)
            );
    }

    toggleUserDeck(deckId: string, status: boolean) {
        return this.http.get<contracts.CollectionChangeStatus>(`api/deck/collection/${enc(deckId)}/${status}`)
            .pipe(catchError(() => of(<contracts.CollectionChangeStatus>{ success: false })));
    }
    toggleIgnoredDeck(deckId: string, status: boolean) {
        return this.http.get<contracts.IgnoredChangeStatus>(`api/deck/ignore/${deckId}/${status}`)
            .pipe(catchError(() => of(<contracts.IgnoredChangeStatus>{ success: false })));
    }

    deleteDeck(deckId: string) {
        return this.http.delete(`api/deck/${enc(deckId)}`)
            .pipe(
                map(resp => true),
                catchError(() => of(false))
            );
    }

    parseUrls(data: { links: string }) {
        return this.http.post<contracts.ParseResult[]>('api/parse', data)
            .pipe(
                catchError(() => of(<contracts.ParseResult[]>[{
                    status: contracts.ParseStatus.fail,
                    error: 'unknow server error',
                    url: ''
                }]))
            );
    }

    importCollection(data: { username: string, password: string }) {
        return this.http.post<contracts.Result>('api/card/import', data)
            .pipe(
                catchError(() => of(<contracts.Result>{
                    success: false,
                    error: 'unknow server error',
                }))
            );
    }

    upgradeDeck(data: { deckId: string, url: string }) {
        return this.http.post<contracts.ParseResult>('api/parse/upgrade', data)
            .pipe(
                catchError(() => of(<contracts.ParseResult>{
                    status: contracts.ParseStatus.fail,
                    error: 'unknow server error',
                    url: ''
                }))
            );
    }

    private withParams(url: string, options?: {}) {

        if (options) {
            const queryParams = Object
                .keys(options)
                .map(key => ({ key, value: options[key] }))
                .filter(kvp => kvp.value != null);
            if (queryParams.length) {
                return url + '?' + queryParams.map(kvp => `${kvp.key}=${kvp.value}`).join('&');
            }
        }
        return url;
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        const errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return observableThrowError(errMsg);
    }




}

export interface CardChanged {
    cardId: string;
    cardAvail: number;
    prevCardAvail: number;
}
