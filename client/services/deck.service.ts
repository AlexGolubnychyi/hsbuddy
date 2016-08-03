import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import * as contracts from "../../interfaces/index";
import "../rxjs-operators";
import {Subject} from "rxjs/Subject";

const enc = encodeURIComponent;

@Injectable()
export class DeckService {
    public cardChanged: Subject<CardChanged>;
    constructor(private http: Http) {
        this.cardChanged = new Subject<CardChanged>();
    }

    getDecks(options?: contracts.DeckQuery): Observable<contracts.Deck[]> {
        let url = this.withParams("api/decks", options);


        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    getCardLibraryInfo(): Observable<contracts.CardLibraryInfo> {
        return this.http.get("api/cardslibrary")
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    getMissingCards(options?: contracts.DeckQuery): Observable<contracts.CardMissing[]> {
        let url = this.withParams("api/missingcards", options);

        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    changeCardAvailability(cardId: string, count: number): Observable<boolean> {
        let request = this.http.get(`api/changenumber/${enc(cardId)}/${count}`)
            .map(resp => true)
            .catch(this.handleError)
            .share(); //to send single request instead of multiple

        request.subscribe(() => {
            this.cardChanged.next({ cardId, count });
        });

        return request;
    }

    toggleUserDeck(deckId: string, status: boolean): Observable<boolean> {
        return this.http.get(`api/toggleuserdeck/${enc(deckId)}/${status}`)
            .map(resp => true)
            .catch(this.handleError);
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