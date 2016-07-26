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
var deck_service_1 = require("../services/deck.service");
var auth_service_1 = require("../services/auth.service");
var card_component_1 = require("./card.component");
require("../rxjs-operators");
//https://angular.io/docs/ts/latest/tutorial/toh-pt6.html
//https://angular.io/docs/ts/latest/cookbook/component-communication.html#!#child-to-parent
var DeckComponent = (function () {
    function DeckComponent(deckService, authService) {
        this.deckService = deckService;
        this.authService = authService;
        this.onChanged = new core_1.EventEmitter();
        this.showUserCollectionFlag = false;
    }
    DeckComponent.prototype.ngOnInit = function () {
        this.showUserCollectionFlag = this.authService.isAuthenticated();
    };
    DeckComponent.prototype.onCardChanged = function () {
        this.onChanged.emit(true);
    };
    DeckComponent.prototype.onChangePersonalCollection = function (enable) {
        var _this = this;
        this.deckService.toggleUserDeck(this.deck.id, enable).subscribe(function () {
            _this.deck.userCollection = enable;
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], DeckComponent.prototype, "deck", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], DeckComponent.prototype, "onChanged", void 0);
    DeckComponent = __decorate([
        core_1.Component({
            selector: "deck",
            templateUrl: "client/components/deck.component.html",
            directives: [card_component_1.CardComponent],
            providers: [deck_service_1.DeckService, auth_service_1.AuthService],
        }), 
        __metadata('design:paramtypes', [deck_service_1.DeckService, auth_service_1.AuthService])
    ], DeckComponent);
    return DeckComponent;
}());
exports.DeckComponent = DeckComponent;
//# sourceMappingURL=deck.component.js.map