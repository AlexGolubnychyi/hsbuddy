"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var Observable_1 = require("rxjs/Observable");
require("../rxjs-operators");
var enc = encodeURIComponent;
var DeckService = (function () {
    function DeckService(http) {
        this.http = http;
    }
    DeckService.prototype.getDecks = function (options) {
        var url = "decks/data", queryParams;
        if (options && (queryParams = Object.keys(options)).length) {
            url += "?" + queryParams.map(function (paramName) { return (paramName + "=" + options[paramName]); }).join("&");
        }
        return this.http.get(url)
            .map(function (resp) { return resp.json(); })
            .catch(this.handleError);
    };
    DeckService.prototype.changeCardAvailability = function (carId, number) {
        return this.http.get("decks/changenumber/" + enc(carId) + "/" + number)
            .map(function (resp) { return true; })
            .catch(this.handleError);
    };
    DeckService.prototype.toggleUserDeck = function (deckId, status) {
        return this.http.get("decks/toggleuserdeck/" + enc(deckId) + "/" + status)
            .map(function (resp) { return true; })
            .catch(this.handleError);
    };
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
    DeckService.prototype.handleError = function (error) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        var errMsg = (error.message) ? error.message :
            error.status ? error.status + " - " + error.statusText : "Server error";
        console.error(errMsg); // log to console instead
        return Observable_1.Observable.throw(errMsg);
    };
    DeckService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], DeckService);
    return DeckService;
}());
exports.DeckService = DeckService;
//# sourceMappingURL=deck.service.js.map