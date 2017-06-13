// jshint esversion:6
import rollup      from "rollup";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs    from "rollup-plugin-commonjs";
import uglify      from "rollup-plugin-uglify";

export default {
    entry: "client/main-prod.js",
    dest:  "public/app.min.js",
    sourceMap: true,
    sourceMapFile: 'public/app.min.js.map',
    format: 'iife',
    onwarn: () => void 0,
    plugins: [
        nodeResolve({jsnext: true, module: true}),
        commonjs({
            include: [
                "node_modules/rxjs/**",
                "node_modules/ngx-bootstrap/**",
                "node_modules/angular2-jwt/**"
            ]//,
            // namedExports: {
            //     "node_modules/ngx-bootstrap/index.js": ["DropdownModule", "CollapseModule","TypeaheadModule"],
            // }
        }),
        uglify()
    ]
};
