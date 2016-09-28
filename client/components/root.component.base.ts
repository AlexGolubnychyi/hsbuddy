import { OnInit, OnDestroy } from "@angular/core";
import { ConfigService, Config } from "../services/config.service";
import { Subscription } from "rxjs/Subscription";
import { DeckService, CardChanged } from "../services/deck.service";

export abstract class RootComponentBase implements OnInit, OnDestroy {
    protected config: Config;
    private configSubscription: Subscription;
    private cardChangedSubscription: Subscription;
    constructor(
        protected configService: ConfigService,
        protected deckService: DeckService
    ) { }

    ngOnInit() {
        this.config = this.configService.config;
        this.configService.configChanged.subscribe(config => {
            this.config = config;
            this.onConfigChanged();
        });
        this.cardChangedSubscription = this.deckService.cardChanged.subscribe(cardChanged => this.onCardChanged(cardChanged));
    }

    ngOnDestroy() {
        if (this.configSubscription) {
            this.configSubscription.unsubscribe();
        }

        if (this.cardChangedSubscription) {
            this.cardChangedSubscription.unsubscribe();
        }
    }

    protected onCardChanged(cardChanged: CardChanged) { };
    protected onConfigChanged() { };
}