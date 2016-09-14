import { Component, Input, OnInit } from "@angular/core";
import { Card } from "../../interfaces";
import { CardSet } from "../../interfaces/hs-types";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { ConfigService, cardStyles } from "../services/config.service";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import "../rxjs-operators";
import { Observable } from "rxjs/Observable";

@Component({
    //moduleId: module.id,
    selector: "card",
    templateUrl: "card.component.html",
})
export class CardComponent implements OnInit {
    @Input()
    card: Card;
    @Input()
    showCount: boolean;
    basic: boolean;
    loading: boolean;
    form: FormGroup;
    cardImgName: string;

    cardStyles = cardStyles;


    constructor(
        private deckService: DeckService,
        private authService: AuthService,
        private configService: ConfigService,
        private fb: FormBuilder) { }

    ngOnInit() {
        this.basic = this.card.cardSet === CardSet.Basic;
        this.cardImgName = this.card.name.toLocaleLowerCase().replace(/ /g, "-").replace(/[',.]/g, "").replace("thaurissan", "thauaissan");

        this.form = this.fb.group({
            "numberAvailable": [this.card.numberAvailable, Validators.pattern("0|1|2")]
        });

        (this.form.valueChanges as Observable<Model>)
            .filter(_ => this.form.valid)
            .debounceTime(200)
            .switchMap(val => this.deckService.changeCardAvailability(this.card.id, val.numberAvailable))
            .subscribe(() => {
                this.card.numberAvailable = this.form.value.numberAvailable;
                this.loading = false;
            });
    }

    getStatus() {
        return (this.basic || !this.authService.isAuthenticated()) ? "" : (this.card.count <= this.card.numberAvailable ? "available" : "notavailable");
    }

    style() {
        return this.configService.config.cardStyle;
    }

    showAvailability() {
        return this.configService.config.enableCardAvailSelector;
    }

    getCardTooltipHtml() {
        return `<div style=""></div>`;
    }
}

interface Model {
    numberAvailable: number;
}