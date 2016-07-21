import { bootstrap }    from "@angular/platform-browser-dynamic";
import { HTTP_PROVIDERS } from "@angular/http";

import {DeckListComponent} from "./components/deck.list.component";

bootstrap(DeckListComponent, [HTTP_PROVIDERS]);