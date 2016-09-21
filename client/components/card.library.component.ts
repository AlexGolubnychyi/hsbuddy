import { Component, OnInit } from "@angular/core";
import { DeckService } from "../services/deck.service";
import { CardLibraryInfo } from "../../interfaces/index";
import { CardClass, CardRarity } from "../../interfaces/hs-types";
import { SortOptions, CardPipeArg } from "../pipes/card.pipe";
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

    filter: CardPipeArg = {
        hideAvailable: false,
        rarity: CardRarity.unknown,
        sort: SortOptions.keepOrder,
        mana: 0
    };

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
    enumKvp(enumerable: { [index: number]: string }) {
        return Object.keys(enumerable).filter(key => !isNaN(parseInt(key))).map(key => ({ name: enumerable[key], value: key }));
    }

    changeAvail() {
        this.filter.hideAvailable = !this.filter.hideAvailable;
        this.applyFilter();
    }

    changeMana(mana: number, $event: MouseEvent) {
        if ($event.ctrlKey) { //add/remove mana from selection
            this.filter.mana = this.filter.mana || 255; //both 0 and 255 mean all cards are selected
            this.filter.mana = this.isManaSelected(mana) ? this.filter.mana - mana : this.filter.mana + mana;
        }
        else {
            //if any other mana selected - select this one, otherwise - select all
            this.filter.mana = this.filter.mana === 0 || (this.filter.mana - (this.filter.mana & mana)) > 0 ? mana : 0;
        }

        this.applyFilter();
    }

    isManaSelected(mana: number) {
        return (this.filter.mana & mana) > 0;
    }

    changeRarity(rarity?: number) {
        this.filter.rarity = +rarity;
        this.applyFilter();
    }

    applyFilter() {
        this.filter = Object.assign({}, this.filter);
    }
}
