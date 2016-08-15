import { Component, Input, OnInit } from "@angular/core";
import { Card } from "../../interfaces";
import { CardSet } from "../../interfaces/hs-types";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import "../rxjs-operators";
import {Observable} from "rxjs/Observable";

@Component({
    selector: "card",
    templateUrl: "client/components/card.component.html",
})
export class CardComponent implements OnInit {
    @Input()
    card: Card;
    @Input()
    showCount: boolean;
    enableAvailability: boolean;
    loading: boolean;
    form: FormGroup;

    constructor(private deckService: DeckService, private authService: AuthService, private fb: FormBuilder) { }

    ngOnInit() {
        this.enableAvailability = this.authService.isAuthenticated() && this.card.cardSet !== CardSet.Basic;

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
        return (!this.enableAvailability || !this.card.count) ? "" : (this.card.count <= this.card.numberAvailable ? "available" : "notavailable");
    }
}

interface Model {
    numberAvailable: number;
}