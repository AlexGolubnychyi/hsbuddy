import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { DeckService } from "../services/deck.service";
import { AuthService } from "../services/auth.service";
import * as contracts from "../../interfaces/index";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeckUtilsService } from "../services/deck.utils.service";
import { Observable } from "rxjs/Observable";

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
    editError: string;
    confirmDeletion = false;

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
        this.deckService.setDescription(this.deck.id, <contracts.DeckChange>this.form.value).subscribe(result => {
            if (result) {

                this.deck.name = this.form.get("name").value;
                this.deck.dateAdded = this.form.get("date").value;
                this.cancelEdit();
                return;
            }
            this.editError = "failed to change deck description";
        });
    }
    delete() {
        if (!this.confirmDeletion) {
            this.confirmDeletion = true;
            return;
        }

        this.loading = true;
        (this.deck.userCollection
            ? this.deckService.toggleUserDeck(this.deck.id, false)
            : Observable.of(<contracts.CollectionChangeStatus>{ success: true }))
            .do(result => this.loading = result.success)
            .filter(result => result.success)
            .switchMap(() => this.deckService.deleteDeck(this.deck.id))
            .subscribe(result => {
                this.loading = false;
                if (result) {
                    this.router.navigateByUrl("/decks");
                    return;
                }

                this.editError = "failed to delete";
            });
    }

    onDeleteDeck(deckId: string) {
        this.router.navigateByUrl("/decks");
    }

    cancelEdit() {
        this.editError = null;
        this.setDefaults();
        this.edit = false;
        this.confirmDeletion = false;
    }

    private setDefaults() {
        this.form.reset({
            name: this.deck.name,
            date: this.deck.dateAdded && (this.deck.dateAdded + "").split("T")[0]
        });
    }
}