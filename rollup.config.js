var nodeResolve = require("rollup-plugin-node-resolve");
var commonjs = require("rollup-plugin-commonjs");

module.exports = {
    entry: "client/main-prod.js",
    onwarn: () => void 0,
    plugins: [
        {
            resolveId: id => {
                if (id.startsWith("rxjs/")) {
                    let result = `${__dirname}/node_modules/rxjs-es/${id.replace("rxjs/", "")}.js`;

                    if (!__dirname.startsWith("/")) {
                        return result.replace(/\//g, "\\");
                    }
                    return result;
                }
            }
        },
        nodeResolve({
            module: true //this allows the ESM modules to be treeshakeable.
        }),
        commonjs()
    ]
};
