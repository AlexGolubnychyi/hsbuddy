// import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
// import { AppModule }              from "./app.module";
// import {enableProdMode}      from "@angular/core";
// enableProdMode();
// platformBrowserDynamic().bootstrapModule(AppModule);



// The browser platform without a compiler
import { platformBrowser } from "@angular/platform-browser";

// The app module factory produced by the static offline compiler
import { AppModuleNgFactory } from "./app.module.ngfactory";

// Launch with the app module factory.
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);