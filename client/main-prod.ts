import { AppModuleNgFactory } from "../ngfactory/client/app.module.ngfactory";
import { platformBrowser } from "@angular/platform-browser";
import {enableProdMode}      from "@angular/core";

enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);
