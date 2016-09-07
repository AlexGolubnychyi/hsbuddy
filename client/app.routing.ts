import { Routes, RouterModule } from "@angular/router";
import {AuthGuard} from "./auth.guard";

import {CardListComponent}  from "./components/card.library.component";
import {CardMissingListComponent}  from "./components/card.missing.list.component";
import {DeckListComponent}  from "./components/deck.list.component";
import {LoginComponent} from  "./components/login.component";
import {AboutComponent} from "./components/about.component";
import {ParseComponent} from "./components/parse.component";

export const appRoutes: Routes = [
  { path: "decks", component: DeckListComponent },
  { path: "cards", component: CardListComponent, canActivate: [AuthGuard] },
  { path: "cards-missing", component: CardMissingListComponent, canActivate: [AuthGuard] },
  { path: "login", component: LoginComponent, canActivate: [AuthGuard] },
  { path: "about", component: AboutComponent },
  { path: "parse", component: ParseComponent, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "decks"}
];

export const routing = RouterModule.forRoot(appRoutes);
