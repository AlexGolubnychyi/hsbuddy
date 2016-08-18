let Builder = require("systemjs-builder"),
    systemConfig = require("../../client/system.config");

var builder = new Builder("./"),
    config = {
        //minify: true,
        sourceMaps: false,
        runtime: false,
        config: systemConfig
    };

builder.buildStatic("app", "./public/app.js", config)
    .then(function () {
        console.log("app packed successfully by systemjs builder");
        process.exit();
    })
    .catch(function (err) {
        console.log("systemjs:build error");
        console.log(err);
        process.exit();
    });