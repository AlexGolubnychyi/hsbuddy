import { Component, Input, Output, OnInit, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { ApiService } from "../services/api.service";
import { DeckUtilsService } from "../services/deck-utils.service";
import { DeckInfo, CollectionChangeStatus } from "../../interfaces/index";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import "../rxjs-operators";
@Component({
    moduleId: module.id,
    selector: "deck-info",
    templateUrl: "deck-info.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckInfoComponent implements OnInit {
    @Input()
    deckInfo: DeckInfo;
    @Output()
    onDeleteDeck = new EventEmitter<string>();

    showUserCollection: boolean;
    userCollectionChangeStream = new Subject();

    constructor(
        private authService: AuthService,
        private apiService: ApiService,
        public utils: DeckUtilsService
    ) { }


    ngOnInit() {
        this.showUserCollection = this.deckInfo.id && this.authService.isAuthenticated();
        (this.userCollectionChangeStream as Observable<boolean>)
            .debounceTime(200)
            .switchMap(val => this.apiService.toggleUserDeck(this.deckInfo.id, val))
            .subscribe((rez: CollectionChangeStatus) => {
                if (rez.success) {
                    this.deckInfo.userCollection = rez.collection;
                }
                if (this.deckInfo.deleted || rez.deckDeleted) {
                    this.onDeleteDeck.emit(this.deckInfo.id);
                }
            });
    }

}