import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import * as contracts from "../../interfaces/index";
import "../rxjs-operators";
import { Subject } from "rxjs/Subject";

const enc = encodeURIComponent;

@Injectable()
export class DeckService {
    public cardChanged: Subject<CardChanged>;
    constructor(private http: Http) {
        this.cardChanged = new Subject<CardChanged>();
    }

    getDecks(options?: contracts.DeckQuery): Observable<contracts.Deck[]> {
        let url = this.withParams("api/deck", options);


        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    getDeckDetail(deckId: string): Observable<contracts.DeckDetail> {
        let url = `api/deck/${deckId}`;

        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    setDescription(deckId: string, description: contracts.DeckChange): Observable<boolean> {
        let url = `api/deck/${deckId}`;

        return this.http.post(url, description)
            .map(resp => (resp.json() as contracts.Result).success)
            .catch(() => Observable.of(false));
    }

    getCardLibraryInfo(): Observable<contracts.CardLibraryInfo> {
        return this.http.get("api/card/library")
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    getMissingCards(options?: contracts.DeckQuery): Observable<contracts.CardMissing[]> {
        let url = this.withParams("api/card/missing", options);

        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    changeCardAvailability(cardId: string, count: number) {
        return this.http.get(`api/card/changenumber/${enc(cardId)}/${count}`)
            .do(resp => {
                this.cardChanged.next({ cardId, count });
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
                status: contracts.ParseStatus.unknown,
                error: "unknow server error",
                url: ""
            }]));
    }

    private withParams(url: string, options?: {}) {
        let queryParams;

        if (options && (queryParams = Object.keys(options)).length) {
            return url + "?" + queryParams.map(paramName => `${paramName}=${options[paramName]}`).join("&");
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
    count: number;
}