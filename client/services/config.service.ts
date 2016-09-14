import { Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";

export enum cardStyles {
    default = 0, compact, textOnly
};

@Injectable()
export class ConfigService {
    private _config: Config;

    constructor(private authService: AuthService) { }

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
        if (!this.authService.isAuthenticated()) {
            return;
        }
        this._config = value;
        localStorage.setItem(this.getLsKey(), JSON.stringify(this._config));
    }

    private load() {
        let auth = this.authService.isAuthenticated(),
            saved = auth && localStorage.getItem(this.getLsKey());

        this._config = (saved && JSON.parse(saved)) || {
            cardStyle: cardStyles.default,
            enableCardAvailSelector: auth
        };
    }

    private getLsKey() {
        return "hsConfigKey" + (this.authService.userName || "");
    }
}

interface Config {
    cardStyle: cardStyles;
    enableCardAvailSelector: boolean;
}