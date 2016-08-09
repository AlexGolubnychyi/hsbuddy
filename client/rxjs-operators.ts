// import "rxjs/Rx"; // adds ALL RxJS statics & operators to Observable

// See node_module/rxjs/Rxjs.js
// Import just the rxjs statics and operators we need for THIS app.

// Statics
import "rxjs/add/observable/throw";

// Operators
import "rxjs/add/operator/catch";
import "rxjs/add/operator/debounce";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";

//Observables
import "rxjs/add/observable/timer";
import "rxjs/add/observable/race";