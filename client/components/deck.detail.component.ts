import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck.utils.service";

@Component({
    //moduleId: module.id,
    selector: "selector",
    templateUrl: "deck.detail.component.html"
})
export class DeckDetailComponent implements OnInit {
    deck: contracts.Deck;
    loading: boolean;
    form: FormGroup;
    edit = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private deckService: DeckService,
        private authService: AuthService,
        private utils: DeckUtilsService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.loading = true;

        this.form = this.fb.group({
            name: ["", Validators.required],
            date: ["", Validators.required]
        });

        this.route.params
            .map(params => params["id"])
            .switchMap<contracts.DeckDetail>(id => this.deckService.getDeckDetail(id))
            .subscribe(deckInfo => {
                this.deck = deckInfo.deck;
                this.loading = false;

                this.setDefaults();
            });
    }

    change() {
        this.deckService.changeDescription(this.deck.id, this.form.value);
    }

    cancelEdit() {
        this.setDefaults();
        this.edit = false;
    }

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
    }
}