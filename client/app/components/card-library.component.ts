
import { Component, OnInit } from '@angular/core';
import { ApiService, CardChanged } from '../services/api.service';
import { CardHashService } from '../services/card-hash.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { CardLibraryInfo, Card } from '../../../interfaces/index';
import { CardClass, CardRarity, CardSet, CardType, hsTypeConverter, dust as dustConst, standardCardSets, wildCardSets } from '../../../interfaces/hs-types';
import { isEmpty, SortOptions, CardPipeArg } from '../pipes/card.pipe';
import { BaseComponent } from './base.component';
import { BarChartData } from './utility/bar-chart.component';
import { PillowChartData } from './utility/pillow-chart.component';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

@Component({
    moduleId: module.id,
    selector: 'card-library',
    templateUrl: 'card-library.component.html',
})
export class CardLibraryComponent extends BaseComponent implements OnInit {
    constructor(
        apiService: ApiService,
        configService: ConfigService,
        private authService: AuthService,
        private cardHashService: CardHashService) {
        super(configService, apiService);
    }
    loading: boolean;
    statsCollapsed: boolean;
    info: CardLibraryInfo<Card>;
    cardSetKvp: { name: string, value: string | number }[];
    rarity = CardRarity;
    rarityChartData: BarChartData;
    classChartData: BarChartData;
    cardSetChartData: BarChartData;
    summaryStats: PillowChartData[] = [];
    mergeCards = false;
    isEmpty = isEmpty;
    cardKeywordInputStream = new Subject();
    request: Subscription;

    filter: CardPipeArg = {
        hideAvailable: false,
        rarity: CardRarity.unknown,
        sort: SortOptions.classic,
        mana: 0,
        cardSet: CardSet.unknown
    };

    ngOnInit() {
        super.ngOnInit();
        this.refreshCards();
        this.statsCollapsed = true;

        this.cardKeywordInputStream
            .map((e: Event) => (e.target as HTMLInputElement).value)
            .debounceTime(200)
            .distinctUntilChanged()
            .subscribe((query: string) => {
                if (!query) {
                    this.filter.keyword = null;
                }
                query = query.trim().toLocaleUpperCase();
                const exactMarker = `"`, delimetr = `$`;

                if ([exactMarker, delimetr].some(char => query.indexOf(char) >= 0)) {
                    const keywords = query.split(delimetr),
                        exactRegex = new RegExp(`^${exactMarker}[^${exactMarker}]+${exactMarker}$`),
                        replaceRegex = new RegExp(exactMarker, 'g'),
                        exact: string[] = [], approx: string[] = [];

                    keywords.forEach(keyword => (exactRegex.test(keyword) ? exact : approx).push(keyword.replace(replaceRegex, '')));
                    this.filter.keyword = { exact, approx };
                } else {
                    // simple query
                    this.filter.keyword = query;
                }

                this.applyFilter();
            });
    }

    enumKvp(enumerable: { [index: number]: string }) {
        return Object
            .keys(enumerable)
            .filter(key => !isNaN(parseInt(key, 10)))
            .map(key => ({
                name: hsTypeConverter.getEnumLabel(enumerable, +key),
                value: key
            }));
    }

    changeAvail() {
        this.filter.hideAvailable = !this.filter.hideAvailable;
        this.applyFilter();
    }

    changeMana(mana: number, $event: MouseEvent) {
        if ($event.ctrlKey) { // add/remove mana from selection
            this.filter.mana = this.filter.mana || 255; // both 0 and 255 mean all cards are selected
            this.filter.mana = this.isManaSelected(mana) ? this.filter.mana - mana : this.filter.mana + mana;
        } else {
            // if any other mana selected - select this one, otherwise - select all
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

    changeCardSet(cardSet?: number) {
        this.filter.cardSet = +cardSet;
        this.applyFilter();
    }

    auth() {
        return this.authService.isAuthenticated();
    }

    private refreshCards() {
        this.loading = true;
        this.cardSetKvp = [CardSet.unknown].concat(this.config.standart ? standardCardSets : wildCardSets).map(key => ({
            name: hsTypeConverter.cardSet(key) as string,
            value: key
        }));
        if (this.config.standart && !standardCardSets.some(set => set === this.filter.cardSet)) {
            this.changeCardSet(0);
        }

        if (this.request) {
            this.request.unsubscribe();
        }
        this.request = this.apiService
            .getCardLibraryInfo(this.config.standart)
            .subscribe(info => {
                this.info = info;
                this.info.groups.forEach((group, inx) => group.collapsed = inx > 0);
                this.loading = false;
                if (this.authService.isAuthenticated()) {
                    this.populateChartData();
                }
            });
    }


    private populateChartData() {
        const rarityColors = ['', 'darkgray', '#0FAF03', '#198EFF', '#AB48EE', '#F07000'];
        this.rarityChartData = {
            valueStyle: 'value',
            image: {
                backSize: 24,
                offsetY: 24,
                src: 'assets/images/other/gems_sprite.png'
            },
            values: Object.keys(this.rarity).filter(key => +key > 0).map(key => ({
                value: (this.info.stats[this.rarity[key]] || [0, 0])[0],
                maxValue: (this.info.stats[this.rarity[key]] || [0, 0])[1],
                barColor: rarityColors[key],
                legend: this.rarity[key]
            }))
        };

        this.classChartData = {
            valueStyle: 'value',
            image: {
                backSize: 25,
                offsetY: 25,
                src: 'assets/images/other/class_sprite2.png',
            },
            values: Object.keys(CardClass).filter(key => +key > 0).map(key => ({
                value: (this.info.stats[CardClass[key]] || [0, 0])[0],
                maxValue: (this.info.stats[CardClass[key]] || [0, 0])[1],
                barColor: 'gray',
                legend: CardClass[key]
            }))
        };

        this.cardSetChartData = {
            valueStyle: 'value',
            values: Object.keys(CardSet).filter(key => +key > 1 && !!this.info.stats[CardSet[key]]).map(key => ({
                value: (this.info.stats[CardSet[key]] || [0, 0])[0],
                maxValue: (this.info.stats[CardSet[key]] || [0, 0])[1],
                barColor: +key === 1 ? 'darkgray' : 'gray',
                legend: <string>hsTypeConverter.cardSet(+key),
                imageSrc: `assets/images/other/exp${key}.png`
            }))
        };
        this.calculateSummaryStats();
    }

    private calculateSummaryStats() {
        // reWritE!!!
        const weapon = this.info.stats[CardType[CardType.weapon]],
            ability = this.info.stats[CardType[CardType.ability]],
            minion = this.info.stats[CardType[CardType.minion]],
            dust = this.info.stats[dustConst],
            total = [weapon[0] + ability[0] + minion[0], weapon[1] + ability[1] + minion[1]];

        this.summaryStats = [
            { legend: 'Total: ', value: total[0], maxValue: total[1], showValues: true },
            { legend: 'Dust:', value: dust[0], maxValue: dust[1], showValues: true },
            { legend: 'Weapons:', value: weapon[0], maxValue: weapon[1], showValues: true },
            { legend: 'Minions:', value: minion[0], maxValue: minion[1], showValues: true },
            { legend: 'Abilities:', value: ability[0], maxValue: ability[1], showValues: true },
        ];
    }

    private applyFilter() {
        this.filter = Object.assign({}, this.filter);
    }

    protected onCardChanged(cardChanged: CardChanged) {
        const card = this.cardHashService.getCard(cardChanged.cardId);

        this.info.groups.some(group => {
            const inx = group.cards.findIndex(c => c.card.id === card.id);
            if (inx >= 0) {
                group.cards[inx].card = card; // update reference to new Card to notify card component about changes
                return true;
            }
            return false;
        });
    }

    protected onConfigChanged(standartChanged: boolean) {
        if (standartChanged) {
            this.refreshCards();
        }
    }
}
