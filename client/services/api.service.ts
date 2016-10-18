import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import * as contracts from "../../interfaces/index";
import "../rxjs-operators";
import { Subject } from "rxjs/Subject";
import { CardHashService } from "./card-hash.service";

const enc = encodeURIComponent;

@Injectable()
export class ApiService {
    public cardChanged: Subject<CardChanged>;
    constructor(private http: Http, private cardHashService: CardHashService) {
        this.cardChanged = new Subject<CardChanged>();
    }

    getDecks(options?: contracts.DeckQuery): Observable<contracts.Deck<contracts.Card>[]> {
        let url = this.withParams("api/deck", options);


        return this.http.get(url)
            .map(resp => resp.json() as contracts.DeckResult<contracts.Deck<string>[]>)
            .map(deckResult => {
                this.cardHashService.feedHash(deckResult.cardHash);
                return deckResult.result.map(deck => this.cardHashService.inflateDeck(deck));
            })
            .catch(this.handleError);
    }

    getDeck(deckId: string): Observable<contracts.Deck<contracts.Card>> {
        let url = `api/deck/${deckId}`;

        return this.http.get(url)
            .map(resp => resp.json() as contracts.DeckResult<contracts.Deck<string>>)
            .map(deckResult => {
                this.cardHashService.feedHash(deckResult.cardHash);
                return this.cardHashService.inflateDeck(deckResult.result);
            })
            .catch(this.handleError);
    }

    getSimilar(deckId: string): Observable<contracts.DeckDiff<contracts.Card>[]> {
        let url = `api/deck/${deckId}/similar`;

        return this.http.get(url)
            .map(resp => resp.json() as contracts.DeckResult<contracts.DeckDiff<string>[]>)
            .map(deckResult => {
                this.cardHashService.feedHash(deckResult.cardHash);
                return deckResult.result.map(deck => this.cardHashService.inflateDiff(deck));
            })
            .catch(this.handleError);
    }

    setDescription(deckId: string, description: contracts.DeckChange): Observable<boolean> {
        let url = `api/deck/${deckId}`;

        return this.http.post(url, description)
            .map(resp => (resp.json() as contracts.Result).success)
            .catch(() => Observable.of(false));
    }

    getCardLibraryInfo(): Observable<contracts.CardLibraryInfo<contracts.Card>> {
        return this.http.get("api/card/library")
            .map(resp => resp.json() as contracts.DeckResult<contracts.CardLibraryInfo<contracts.Card | string>>)
            .map(deckResult => { //LAZY INFLATE
                this.cardHashService.feedHash(deckResult.cardHash);
                deckResult.result.groups.forEach(group => {
                    group.cards.forEach(c => c.card = this.cardHashService.getCard(c.card as string));
                });
                return deckResult.result as contracts.CardLibraryInfo<contracts.Card>;
            })
            .catch(this.handleError);
    }

    getMissingCards(options?: contracts.DeckQuery): Observable<contracts.CardMissing<contracts.Card>[]> {
        let url = this.withParams("api/card/missing", options);

        return this.http.get(url)
            .map(resp => resp.json() as contracts.DeckResult<contracts.CardMissing<contracts.Card | string>[]>)
            .map(deckResult => { //LAZY INFLATE
                this.cardHashService.feedHash(deckResult.cardHash);
                deckResult.result.forEach(cardMissing => cardMissing.cardCount.card = this.cardHashService.getCard(cardMissing.cardCount.card as string));
                return deckResult.result as contracts.CardMissing<contracts.Card>[];
            })
            .catch(this.handleError);
    }

    changeCardAvailability(cardId: string, cardAvail: number, prevCardAvail: number) {
        return this.http.get(`api/card/changenumber/${enc(cardId)}/${cardAvail}`)
            .do(resp => {
                this.cardHashService.updateAvailability(cardId, cardAvail);
                this.cardChanged.next({ cardId, cardAvail, prevCardAvail });
            })
            .map(resp => true)
            .catch(this.handleError);
    }

    toggleUserDeck(deckId: string, status: boolean) {
        return this.http.get(`api/deck/collection/${enc(deckId)}/${status}`)
            .map(resp => resp.json() as contracts.CollectionChangeStatus)
            .catch(() => Observable.of(<contracts.CollectionChangeStatus>{ success: false }));
    }

    deleteDeck(deckId: string) {
        return this.http.delete(`api/deck/${enc(deckId)}`)
            .map(resp => true)
            .catch(() => Observable.of(false));
    }

    parseUrls(data: { urls: string }) {
        return this.http.post("api/parse", data)
            .map(resp => resp.json() as contracts.ParseResult[])
            .catch(() => Observable.of(<contracts.ParseResult[]>[{
                status: contracts.ParseStatus.fail,
                error: "unknow server error",
                url: ""
            }]));
    }

    private withParams(url: string, options?: {}) {

        if (options) {
            let queryParams = Object
                .keys(options)
                .map(key => ({ key, value: options[key] }))
                .filter(kvp => kvp.value != null);
            if (queryParams.length) {
                return url + "?" + queryParams.map(kvp => `${kvp.key}=${kvp.value}`).join("&");
            }
        }
        return url;
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : "Server error";
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }




}

export interface CardChanged {
    cardId: string;
    cardAvail: number;
    prevCardAvail: number;
}