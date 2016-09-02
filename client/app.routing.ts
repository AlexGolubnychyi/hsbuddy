import { Routes, RouterModule } from "@angular/router";
import {AuthGuard} from "./auth.guard";

import {CardListComponent}  from "./components/card.library.component";
import {CardMissingListComponent}  from "./components/card.missing.list.component";
import {DeckListComponent}  from "./components/deck.list.component";

export const appRoutes: Routes = [
  { path: "decks", component: DeckListComponent },
  { path: "cards", component: CardListComponent, canActivate: [AuthGuard] },
  { path: "cards-missing", component: CardMissingListComponent, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "decks"}
];

export const routing = RouterModule.forRoot(appRoutes);
