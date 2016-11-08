import * as express from "express";
import * as path from "path";
import { json, urlencoded } from "body-parser";
import setRoutes from "./routes";
import { config } from "./lib/config";
import loadUserInfo from "./middleware/loadUserInfo";
import * as logger from "morgan";
import mongoose from "./lib/mongoose";
import * as jwt from "express-jwt";
import * as compression from "compression";
import * as favicon from "serve-favicon";
import less = require("less-middleware");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(compression());
app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));
app.use(logger("dev"));

//LESS
app.use(less(path.join(__dirname, "../public"), { once: true }));
//static files
app.use(express.static(path.join(__dirname, "../public")));
app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")));

//dev folder mapping
if (app.get("env") === "development") {
    app.use("/client", express.static(path.join(__dirname, "../client")));
    app.use("/interfaces", express.static(path.join(__dirname, "../interfaces")));
}

//hack, if at this point static file is not found then short circuit to 404
//remove when move to angular routing completely or creat routing sublevel
app.use((req, res, next) => {
    let fileRequest = [".js", ".ts", ".html", ".ico", ".css"].some(ending => req.url.slice(-ending.length) === ending);
    if (fileRequest) {
        let err = new Error("Not Found") as any;
        err.status = 404;
        next(err);
        return;
    }
    next();
});

//check auth token
app.use(jwt({ secret: config.mySecret, credentialsRequired: false }));
//chech that user exists in db
app.use(loadUserInfo);

//support for req.body
app.use(json());
app.use(urlencoded({ extended: false }));

//finally, routing
setRoutes(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error("Not Found") as any;
    err.status = 404;
    next(err);
});


// error handlers
// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});


export default app;
