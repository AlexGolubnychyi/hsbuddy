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
var hs_types_1 = require("../../interfaces/hs-types");
var deck_service_1 = require("../services/deck.service");
var auth_service_1 = require("../services/auth.service");
var CardComponent = (function () {
    function CardComponent(deckService, authService) {
        this.deckService = deckService;
        this.authService = authService;
        this.onChanged = new core_1.EventEmitter();
    }
    CardComponent.prototype.ngOnInit = function () {
        this.enableAvailability = this.authService.isAuthenticated() && this.card.set !== hs_types_1.CardSet.Basic;
        this.available = this.card.count <= this.card.numberAvailable;
    };
    CardComponent.prototype.onChangeAvailability = function (newValue) {
        var _this = this;
        this.deckService.changeCardAvailability(this.card.id, newValue).subscribe(function () {
            _this.onChanged.emit(true);
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], CardComponent.prototype, "card", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], CardComponent.prototype, "onChanged", void 0);
    CardComponent = __decorate([
        core_1.Component({
            selector: "card",
            templateUrl: "client/components/card.component.html",
            providers: [deck_service_1.DeckService, auth_service_1.AuthService],
            changeDetection: core_1.ChangeDetectionStrategy.OnPush
        }), 
        __metadata('design:paramtypes', [deck_service_1.DeckService, auth_service_1.AuthService])
    ], CardComponent);
    return CardComponent;
}());
exports.CardComponent = CardComponent;
//# sourceMappingURL=card.component.js.map