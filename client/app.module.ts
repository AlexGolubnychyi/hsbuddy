import { NgModule } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";

import { routing } from "./app.routing";
import { HttpModule } from "@angular/http";

import { AuthGuard } from "./auth.guard";
import { AuthService } from "./services/auth.service";
import { ApiService } from "./services/api.service";
import { ConfigService } from "./services/config.service";
import { CardHashService } from "./services/card.hash.service";
import { DeckUtilsService } from "./services/deck-utils.service";

import { AppComponent } from "./components/app.component";
import { CardComponent } from "./components/card.component";
import { DeckComponent } from "./components/deck.component";
import { DeckListComponent } from "./components/deck-list.component";
import { CardListComponent } from "./components/card-library.component";
import { DeckFilterComponent } from "./components/deck-filter.component";
import { CardMissingListComponent } from "./components/card-missing-list.component";
import { SpinnerComponent } from "./components/spinner.component";
import { LoginComponent } from "./components/login.component";
import { AboutComponent } from "./components/about.component";
import { ParseComponent } from "./components/parse.component";
import { DeckDetailComponent } from "./components/deck-detail.component";
import { ManaCurveComponent } from "./components/mana-curve.component";
import { BarChartComponent } from "./components/bar-chart.component";
import { PillowChartComponent } from "./components/pillow-chart.component";
import { DropdownModule } from "./components/ng2-bootstrap/dropdown/dropdown.module";
import { CardPipe } from "./pipes/card.pipe";
import { CardToolTipDirective } from "./directives/card-tooltip.directive";
@NgModule({
    imports: [
        BrowserModule,
        routing,
        ReactiveFormsModule,
        FormsModule,
        HttpModule,
        DropdownModule
    ],
    declarations: [
        ManaCurveComponent,
        BarChartComponent,
        PillowChartComponent,
        CardToolTipDirective,
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
        ApiService,
        DeckUtilsService,
        ConfigService,
        CardHashService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }


