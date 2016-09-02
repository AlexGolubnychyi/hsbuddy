import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule }              from "./app.module";
import {enableProdMode}      from "@angular/core";
enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);


// import { AppModuleNgFactory } from "../ngfactory/client/app.module.ngfactory";
// import { platformBrowser } from "@angular/platform-browser";
// platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);