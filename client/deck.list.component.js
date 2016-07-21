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
var card_component_1 = require("./card.component");
var deck_service_1 = require("./deck.service");
require("./rxjs-operators");
//https://angular.io/docs/ts/latest/tutorial/toh-pt6.html
//https://angular.io/docs/ts/latest/cookbook/component-communication.html#!#child-to-parent
var DeckListComponent = (function () {
    function DeckListComponent(deckService) {
        this.deckService = deckService;
        this.decks = [];
    }
    DeckListComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.deckService.getDecks().subscribe(function (decks) { return _this.decks = decks; });
    };
    DeckListComponent = __decorate([
        core_1.Component({
            selector: "deck-list",
            templateUrl: "client/deck.list.component.html",
            directives: [card_component_1.CardComponent],
            providers: [deck_service_1.DeckService]
        }), 
        __metadata('design:paramtypes', [deck_service_1.DeckService])
    ], DeckListComponent);
    return DeckListComponent;
}());
exports.DeckListComponent = DeckListComponent;
//# sourceMappingURL=deck.list.component.js.map