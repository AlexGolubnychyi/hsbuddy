import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';

export enum cardStyles {
    default = 0, compact, textOnly
}

@Injectable()
export class ConfigService {
    private _config: Config;

    configChanged: Subject<Config>;

    constructor(private authService: AuthService) {
        this.configChanged = new Subject<Config>();
    }

    refresh() {
        this.load();
    }

    get config() {
        if (!this._config) {
            this.load();
        }
        return this._config;
    }

    set config(value: Config) {
        this._config = value;
        if (this.authService.isAuthenticated()) {
            localStorage.setItem(this.getLsKey(), JSON.stringify(this._config));
        }
        this.configChanged.next(this._config);
    }

    private load() {
        const auth = this.authService.isAuthenticated(),
            saved = auth && localStorage.getItem(this.getLsKey());

        this._config = (saved && JSON.parse(saved)) || {
            cardStyle: cardStyles.default,
            enableCardAvailSelector: auth,
            splitCardListByClass: false,
            standart: false,
        };
    }

    private getLsKey() {
        return 'hsConfigKey' + (this.authService.userName || '');
    }
}

export interface Config {
    cardStyle: cardStyles;
    enableCardAvailSelector: boolean;
    splitCardListByClass: boolean;
    standart: boolean;
}
