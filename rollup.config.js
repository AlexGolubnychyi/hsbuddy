// jshint esversion:6
import rollup      from "rollup";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs    from "rollup-plugin-commonjs";
import uglify      from "rollup-plugin-uglify";

module.exports = {
    entry: "client/main-prod.js",
    onwarn: () => void 0,
    plugins: [
        nodeResolve({jsnext: true, module: true}),
        commonjs({
            include: [
                "node_modules/rxjs/**",
                "node_modules/ng2-bootstrap/**",
                "node_modules/angular2-jwt/**"
            ]
        }),
        uglify()
    ]
};
