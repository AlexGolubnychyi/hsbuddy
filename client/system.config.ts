/** Type declaration for ambient System. */
declare var System: any;
declare var module: NodeModule;

(function (global) {
    let config = {
        paths: {
            "npm:": "node_modules/"
        },
        map: {
            "app": "client", // "dist",
            "interfaces": "interfaces",
            "ng2-bootstrap": "npm:ng2-bootstrap",
            "rxjs": "npm:rxjs",
            "@angular/core": "npm:@angular/core/bundles/core.umd.js",
            "@angular/common": "npm:@angular/common/bundles/common.umd.js",
            "@angular/compiler": "npm:@angular/compiler/bundles/compiler.umd.js",
            "@angular/platform-browser": "npm:@angular/platform-browser/bundles/platform-browser.umd.js",
            "@angular/platform-browser-dynamic": "npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js",
            "@angular/http": "npm:@angular/http/bundles/http.umd.js",
            "@angular/router": "npm:@angular/router/bundles/router.umd.js",
            "@angular/forms": "npm:@angular/forms/bundles/forms.umd.js",
        },
        packages: {
            "@angular": {defaultExtension: "js"},
            ngfactory: {defaultExtension: "js"},
            app: { main: "main.js", defaultExtension: "js" },
            "ng2-bootstrap": { defaultExtension: "js" },
            interfaces: { defaultExtension: "js" },
            rxjs: { defaultExtension: "js" },
        }
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

