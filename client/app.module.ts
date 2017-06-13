import { NgModule } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { routing } from "./app.routing";
import { HttpModule } from "@angular/http";

import { AuthGuard } from "./auth.guard";
import { AuthService } from "./services/auth.service";
import { ApiService } from "./services/api.service";
import { ConfigService } from "./services/config.service";
import { CardHashService } from "./services/card-hash.service";
import { DeckUtilsService } from "./services/deck-utils.service";

import { AppComponent } from "./components/app.component";
import { CardComponent } from "./components/card.component";
import { CardListComponent } from "./components/card-list.component";
import { DeckComponent } from "./components/deck.component";
import { DeckInfoComponent } from "./components/deck-info.component";
import { DeckListComponent } from "./components/deck-list.component";
import { CardLibraryComponent } from "./components/card-library.component";
import { DeckFilterComponent } from "./components/deck-filter.component";
import { CardMissingListComponent } from "./components/card-missing-list.component";
import { SpinnerComponent } from "./components/utility/spinner.component";
import { LoginComponent } from "./components/login.component";
import { CardImportComponent } from "./components/card-import.component";
import { AboutComponent } from "./components/about.component";
import { ParseComponent } from "./components/parse.component";
import { DeckDetailComponent } from "./components/deck-detail.component";
import { ManaCurveComponent } from "./components/utility/mana-curve.component";
import { BarChartComponent } from "./components/utility/bar-chart.component";
import { PillowChartComponent } from "./components/utility/pillow-chart.component";
import { BsDropdownModule } from "ngx-bootstrap/dropdown/bs-dropdown.module";
import { CollapseModule } from "ngx-bootstrap/collapse/collapse.module";
import { TypeaheadModule } from "ngx-bootstrap/typeahead/typeahead.module";
import { CardPipe } from "./pipes/card.pipe";
import { CardToolTipDirective } from "./directives/card-tooltip.directive";
import { authProvider } from "./adapters/angular2-jwt.adapter";


@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        routing,
        ReactiveFormsModule,
        FormsModule,
        HttpModule,
        BsDropdownModule.forRoot(),
        CollapseModule.forRoot(),
        TypeaheadModule.forRoot()
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
        DeckInfoComponent,
        DeckFilterComponent,
        DeckListComponent,
        CardListComponent,
        CardLibraryComponent,
        CardMissingListComponent,
        LoginComponent,
        CardImportComponent,
        AboutComponent,
        ParseComponent,
        DeckDetailComponent,
        AppComponent
    ],
    providers: [
        authProvider,
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


