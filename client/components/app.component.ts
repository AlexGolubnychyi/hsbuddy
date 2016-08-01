import { Component } from "@angular/core";
import { ROUTER_DIRECTIVES } from "@angular/router";

import {DeckListComponent} from "./deck.list.component";
import {CardListComponent} from "./card.list.component";
import { CardMissingListComponent }  from "./card.missing.list.component";

@Component({
    selector: "hs-app",
    templateUrl: "client/components/app.component.html",
    directives: [ROUTER_DIRECTIVES],
    precompile: [DeckListComponent, CardListComponent,CardMissingListComponent]
})
export class AppComponent  {

}