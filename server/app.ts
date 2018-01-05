import * as express from 'express';
import * as path from 'path';
import * as jwt from 'express-jwt';
import * as compression from 'compression';
import * as logger from 'morgan';
import { json, urlencoded } from 'body-parser';
import { config } from './lib/config';
import { loadUserInfo } from './middleware/loadUserInfo';
import mongoose from './lib/mongoose';
import { apiRouter } from './routes/index';

const app = express();

app.use(compression());
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, '../public')));

// check auth token
app.use(jwt({ secret: config.mySecret, credentialsRequired: false }));
// chech that user exists in db
app.use(loadUserInfo);

// support for req.body
app.use(json());
app.use(urlencoded({ extended: false }));

// Routing
app.use('/api', apiRouter);

app.use('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found') as any;
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        err.status = err.status || 500;
        res.status(err.status);
        res.send(`
            <h1>[error ${err.status}] ${err.message}</h1>
            <pre>${err.stack}</pre>
        `);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    err.status = err.status || 500;
    res.status(err.status);
    res.send(`
        <h1>[error ${err.status}] ${err.message}</h1>
    `);
});


export default app;
