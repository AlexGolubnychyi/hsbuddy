import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import {Deck} from "../interfaces";
import "./rxjs-operators";

const enc = encodeURIComponent;
const userId = "jess-eu";

@Injectable()
export class DeckService {
    constructor(private http: Http) { }

    getDecks(): Observable<Deck[]> {
        return this.http.get(`decks/${enc(userId)}/data`)
            .map(resp => resp.json())
            .catch(this.handleError);
    }

    changeCardAvailability(carId: string, number: number): Observable<boolean> {
        return this.http.get(`decks/${enc(userId)}/changenumber/${enc(carId)}/${number}`)
            .map(resp => true)
            .catch(this.handleError);
    }

    // private post(hero: Hero): Promise<Hero> {
    //     let headers = new Headers({
    //         'Content-Type': 'application/json'
    //     });

    //     return this.http
    //         .post(this.heroesUrl, JSON.stringify(hero), { headers: headers })
    //         .toPromise()
    //         .then(res => res.json().data)
    //         .catch(this.handleError);
    // }

    // private extractData(res: Response) {
    //     let body = res.json();
    //     return body.data || {};
    // }
    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : "Server error";
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }


}