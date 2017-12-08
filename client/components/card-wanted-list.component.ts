import { Component, OnInit } from "@angular/core";
import { ApiService, CardChanged } from "../services/api.service";
import { DeckUtilsService } from "../services/deck-utils.service";
import { CardMissing, Card, DeckQuery } from "../../interfaces/index";
import { DeckFilterComponent } from "./deck-filter.component";
import { BaseComponent } from "./base.component";
import { ConfigService } from "../services/config.service";
import { CardHashService } from "../services/card-hash.service";

@Component({
    moduleId: module.id,
    selector: "missing-card-list",
    templateUrl: "card-missing-list.component.html"
})
export class CardWantedListComponent extends BaseComponent implements OnInit {

    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private utils: DeckUtilsService,
        private cardHashService: CardHashService
    ) { super(configService, apiService); }
    loading: boolean = true;
    missingCards: CardMissing<Card>[];
    ngOnInit(){
        super.ngOnInit();
        // this.filter.filter$
        //     .do<[DeckQuery, boolean]>(() => this.loading = true)
        //     .switchMap(([params, standart]) => this.apiService.getMissingCards(standart, params))
        //     .subscribe(cards => {
        //         this.missingCards = cards;
        //         this.loading = false;
        //     });
    }

}
