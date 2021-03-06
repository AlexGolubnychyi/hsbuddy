import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

import { CardLibraryComponent } from './components/card-library.component';
import { CardMissingListComponent } from './components/card-missing-list.component';
import { DeckListComponent } from './components/deck-list.component';
import { LoginComponent } from './components/login.component';
import { CardImportComponent } from './components/card-import.component';
import { AboutComponent } from './components/about.component';
import { ParseComponent } from './components/parse.component';
import { DeckDetailComponent } from './components/deck-detail.component';

export const appRoutes: Routes = [
  { path: 'decks', component: DeckListComponent },
  { path: 'cards', component: CardLibraryComponent },
  { path: 'cards-missing', component: CardMissingListComponent, canActivate: [AuthGuard] },
  { path: 'card-import', component: CardImportComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'about', component: AboutComponent },
  { path: 'parse', component: ParseComponent, canActivate: [AuthGuard] },
  { path: 'deck/:id', component: DeckDetailComponent },
  { path: '**', redirectTo: 'decks' }
];

export const routing = RouterModule.forRoot(appRoutes);
