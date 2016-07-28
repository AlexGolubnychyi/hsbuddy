import { Injectable, EventEmitter } from "@angular/core";
import { Http } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import {Deck, DeckQuery} from "../../interfaces/index";
import "../rxjs-operators";
import {Subject} from "rxjs/Subject";

const enc = encodeURIComponent;

@Injectable()
export class DeckService {
    public cardChanged: Subject<CardChanged>;
    constructor(private http: Http) {
        this.cardChanged = new Subject<CardChanged>();
    }

    getDecks(options?: DeckQuery): Observable<Deck[]> {
        let url = "decks/data", queryParams;

        if (options && (queryParams = Object.keys(options)).length) {
            url += "?" + queryParams.map(paramName => `${paramName}=${options[paramName]}`).join("&");
        }

        return this.http.get(url)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    changeCardAvailability(cardId: string, count: number): Observable<boolean> {
        let request = this.http.get(`decks/changenumber/${enc(cardId)}/${count}`)
            .map(resp => true)
            .catch(this.handleError);

        request.subscribe(() => {
            this.cardChanged.next({ cardId, count });
        });
        return request;
    }

    toggleUserDeck(deckId: string, status: boolean): Observable<boolean> {
        return this.http.get(`decks/toggleuserdeck/${enc(deckId)}/${status}`)
            .map(resp => true)
            .catch(this.handleError);
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