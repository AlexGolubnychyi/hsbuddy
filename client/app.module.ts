import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";

import { routing } from "./app.routing";
import { HttpModule } from "@angular/http";

import { AuthGuard } from "./auth.guard";
import { AuthService } from "./services/auth.service";
import { DeckService } from "./services/deck.service";
import { ConfigService } from "./services/config.service";
import { DeckUtilsService } from "./services/deck.utils.service";

import { AppComponent } from "./components/app.component";
import { CardComponent } from "./components/card.component";
import { DeckComponent } from "./components/deck.component";
import { DeckListComponent } from "./components/deck.list.component";
import { CardListComponent } from "./components/card.library.component";
import { DeckFilterComponent } from "./components/deck.filter.component";
import { CardMissingListComponent } from "./components/card.missing.list.component";
import { SpinnerComponent } from "./components/spinner.component";
import {LoginComponent} from "./components/login.component";
import {AboutComponent} from "./components/about.component";
import {ParseComponent} from "./components/parse.component";
import { DeckDetailComponent } from "./components/deck.detail.component";
//import {TooltipModule } from "./components/ng2-bootstrap/tooltip/tooltip.module";
import { CardPipe } from "./pipes/card.pipe";

@NgModule({
    imports: [
        BrowserModule,
        routing,
        ReactiveFormsModule,
        HttpModule,
     //   TooltipModule
     //   DropdownModule
    ],
    declarations: [
        CardPipe,
        SpinnerComponent,
        CardComponent,
        DeckComponent,
        DeckFilterComponent,
        DeckListComponent,
        CardListComponent,
        CardMissingListComponent,
        LoginComponent,
        AboutComponent,
        ParseComponent,
        DeckDetailComponent,
        AppComponent
    ],
    providers: [
        AuthGuard,
        AuthService,
        DeckService,
        DeckUtilsService,
        ConfigService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}


