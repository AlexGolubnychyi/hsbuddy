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
var deck_component_1 = require("./deck.component");
var deck_service_1 = require("../services/deck.service");
var auth_service_1 = require("../services/auth.service");
var hs_types_1 = require("../../interfaces/hs-types");
require("../rxjs-operators");
var localStorageKey = "hs-fun:filters";
var DeckListComponent = (function () {
    function DeckListComponent(deckService, authService) {
        this.deckService = deckService;
        this.authService = authService;
        this.decks = [];
        this.deckClasses = (Object.keys(hs_types_1.CardClass).filter(function (key) { return !isNaN(+key); }))
            .map(function (id) { return ({ name: hs_types_1.CardClass[id], value: +id }); })
            .filter(function (item) { return item.value !== hs_types_1.CardClass.neutral; });
    }
    DeckListComponent.prototype.ngOnInit = function () {
        var filters = localStorage.getItem(localStorageKey);
        this.useUserCollectionFilter = this.authService.isAuthenticated();
        var useLocalStorage = !!filters && this.authService.isAuthenticated();
        _a = useLocalStorage
            ? JSON.parse(filters)
            : [false, hs_types_1.CardClass.unknown, null], this.userCollection = _a[0], this.selectedClass = _a[1], this.dustNeeded = _a[2];
        this.refreshDecks();
        var _a;
    };
    DeckListComponent.prototype.onDeckChanged = function () {
        this.refreshDecks();
    };
    DeckListComponent.prototype.applyFilters = function () {
        if (this.authService.isAuthenticated()) {
            localStorage.setItem(localStorageKey, JSON.stringify([this.userCollection, this.selectedClass, this.dustNeeded]));
        }
        this.refreshDecks();
    };
    DeckListComponent.prototype.refreshDecks = function () {
        var _this = this;
        var params = {};
        if (typeof this.dustNeeded === "number") {
            params.dustNeeded = this.dustNeeded;
        }
        if (this.selectedClass > 0) {
            params.deckClass = this.selectedClass;
        }
        if (this.userCollection) {
            params.userCollection = true;
        }
        this.deckService
            .getDecks(params)
            .subscribe(function (decks) {
            _this.decks = decks;
        });
    };
    DeckListComponent = __decorate([
        core_1.Component({
            selector: "deck-list",
            templateUrl: "client/components/deck.list.component.html",
            directives: [deck_component_1.DeckComponent],
            providers: [deck_service_1.DeckService, auth_service_1.AuthService],
        }), 
        __metadata('design:paramtypes', [deck_service_1.DeckService, auth_service_1.AuthService])
    ], DeckListComponent);
    return DeckListComponent;
}());
exports.DeckListComponent = DeckListComponent;
//# sourceMappingURL=deck.list.component.js.map