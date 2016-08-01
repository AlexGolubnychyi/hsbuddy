import { provideRouter, RouterConfig } from "@angular/router";
import {AuthGuard} from "./auth.guard";

import { CardListComponent }  from "./components/card.list.component";
import { CardMissingListComponent }  from "./components/card.missing.list.component";
import { DeckListComponent }  from "./components/deck.list.component";

const routes: RouterConfig = [
  { path: "decks", component: DeckListComponent },
  { path: "cards", component: CardListComponent, canActivate: [AuthGuard] },
  { path: "cards-missing", component: CardMissingListComponent, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "decks", terminal: true }
];

export const appRouterProviders = [
  provideRouter(routes)
];