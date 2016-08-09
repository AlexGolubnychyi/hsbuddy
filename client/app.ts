import { bootstrap }    from "@angular/platform-browser-dynamic";
import { HTTP_PROVIDERS } from "@angular/http";
import { appRouterProviders } from "./app.routes";
import {AuthGuard} from "./auth.guard";
import {AuthService} from "./services/auth.service";
import {DeckService} from "./services/deck.service";
import {AppComponent} from "./components/app.component";
import {enableProdMode} from "@angular/core";
import { disableDeprecatedForms, provideForms } from "@angular/forms";
enableProdMode();

bootstrap(AppComponent, [
    HTTP_PROVIDERS,
    appRouterProviders,
    AuthService,
    DeckService,
    AuthGuard,
    disableDeprecatedForms(),
    provideForms()])
    .catch(err => console.error(err));