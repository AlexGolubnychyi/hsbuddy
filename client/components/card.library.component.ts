import { Component, OnInit } from "@angular/core";
import {DeckService} from "../services/deck.service";
import {CardLibraryInfo} from "../../interfaces/index";
import {CardClass, CardRarity} from "../../interfaces/hs-types";

@Component({
    //moduleId: module.id,
    selector: "card-library",
    templateUrl: "card.library.component.html",
})
export class CardListComponent implements OnInit {
    constructor(private deckService: DeckService) { }
    loading: boolean;
    statsCollapsed: boolean;
    info: CardLibraryInfo;
    stats: {};
    rarity = CardRarity;
    classes = CardClass;

    ngOnInit() {
        this.refreshCards();
        this.statsCollapsed = true;

    }

    private refreshCards() {
        this.loading = true;
        this.deckService
            .getCardLibraryInfo()
            .subscribe(info => {
                this.info = info;
                this.info.groups.forEach((group, inx) => group.collapsed = inx > 0);
                this.loading = false;
            });
    }

    enumerate(enumerable: { [index: number]: string }) {
        return Object.keys(enumerable)
            .filter(key => !isNaN(parseInt(key)))
            .map(key => enumerable[key])
            .filter(name => !!this.info.stats[name])
            .map(name => ({ count: this.info.stats[name][0], total: this.info.stats[name][1], name }));
    }
}
