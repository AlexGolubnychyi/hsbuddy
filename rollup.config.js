var nodeResolve = require("rollup-plugin-node-resolve");

module.exports = {
    entry: "client/main-prod.js",
    onwarn: () => void 0,
    plugins: [
        {
            resolveId: id => {
                if (id.startsWith("rxjs/")) {
                    let result = `${__dirname}/node_modules/rxjs-es/${id.replace("rxjs/", "")}.js`;

                    if (__dirname.indexOf("\\" >= 0)) {
                        return result.replace(/\//g, "\\");
                    }
                    return result;
                }
            }
        },
        nodeResolve({
            module: true //this allows the ESM modules to be treeshakeable.
        })
    ]
};
