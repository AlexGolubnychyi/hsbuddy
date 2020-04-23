
import mongoose = require('mongoose');
import * as Promise from 'bluebird';
import { appConfig } from './appconfig';
import * as chalk from 'chalk';

/**
 * Connect to MongoDB.
 */
mongoose.Promise = Promise;
mongoose.connect(appConfig.dbConnection);
mongoose.connection.on('error', () => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});


export default mongoose;
