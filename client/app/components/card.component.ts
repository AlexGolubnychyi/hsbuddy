import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Card } from '../../../interfaces';
import { CardRarity, CardSet } from '../../../interfaces/hs-types';
import '../rxjs-operators';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Config, cardStyles } from '../services/config.service';

@Component({
    moduleId: module.id,
    selector: 'card',
    templateUrl: 'card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit {
    @Input()
    card: Card;
    @Input()
    count: number;
    @Input()
    showCount: boolean;
    @Input()
    config: Config;
    @Input()
    noHighlight = false;

    basic: boolean;
    loading: boolean;
    cardImgName: string;

    cardStyles = cardStyles;

    constructor(
        private deckService: ApiService,
        private authService: AuthService) { }

    ngOnInit() {
        this.basic = this.card.cardSet === CardSet.Basic;
    }

    getStatus() {
        return (this.basic || !this.authService.isAuthenticated()) ? '' : (this.count <= this.card.numberAvailable ? 'available' : 'notavailable');
    }

    getAvailStatus() {
        if (this.noHighlight || this.basic || !this.authService.isAuthenticated() || this.count <= this.card.numberAvailable) {
            return '';
        }

        return this.card.numberAvailable > 0 ? 'semiavailable' : 'notavailable';
    }

    shouldShowCount() {
        return this.showCount && this.card.rarity !== CardRarity.legendary;
    }

    changeAvailability(cardAvail: number) {
        const prevCardAvail = this.card.numberAvailable;
        cardAvail = +cardAvail;
        this.loading = true;
        this.deckService
            .changeCardAvailability(this.card.id, cardAvail, prevCardAvail)
            .subscribe(() => {
                this.loading = false;
            });
    }

}

interface Model {
    numberAvailable: number;
}
