/** Type declaration for ambient System. */
declare var System: any;

(function (global) {
    // map tells the System loader where to look for things
    var map = {
        "app": "client", // "dist",
        "interfaces": "interfaces",
        "@angular": "node_modules/@angular",
        "ng2-bootstrap": "node_modules/ng2-bootstrap",
        "rxjs": "node_modules/rxjs"
    };
    // packages tells the System loader how to load when no filename and/or no extension
    var packages = {
        "app": { main: "app.js", defaultExtension: "js" },
        "ng2-bootstrap": { defaultExtension: "js" },
        "interfaces": { defaultExtension: "js" },
        "rxjs": { defaultExtension: "js" },
    };
    var ngPackageNames = [
        "common",
        "compiler",
        "core",
        "forms",
        "http",
        "platform-browser",
        "platform-browser-dynamic",
        "router",
        "router-deprecated",
        "upgrade",
    ];
    // Individual files (~300 requests):
    function packIndex(pkgName) {
        packages["@angular/" + pkgName] = { main: "index.js", defaultExtension: "js" };
    }
    // Bundled (~40 requests):
    function packUmd(pkgName) {
        packages["@angular/" + pkgName] = { main: "/bundles/" + pkgName + ".umd.js", defaultExtension: "js" };
    }

    // Most environments should use UMD; some (Karma) need the individual index files
    var setPackageConfig = (typeof System !== "undefined" && System.packageWithIndex) ? packIndex : packUmd;
    // Add package entries for angular packages
    ngPackageNames.forEach(setPackageConfig);
    var config = {
        map: map,
        packages: packages
    };

    if (typeof module !== "undefined") {
        //for builder
        module.exports = config;
    }
    else {
        //for dev mode
        System.config(config);
    }
})(this);

