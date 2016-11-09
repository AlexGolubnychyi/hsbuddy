
import mongoose = require("mongoose");
import * as Promise from "bluebird";
import { config } from "./config";
import * as chalk from "chalk";

/**
 * Connect to MongoDB.
 */
let connection = process.env.NODE_ENV === "prod" ? config.prodDBConnectionString : config.devDBConnectionString;
mongoose.Promise = Promise;
mongoose.connect(connection);
mongoose.connection.on("error", () => {
    console.log("%s MongoDB connection error. Please make sure MongoDB is running.", chalk.red("✗"));
    process.exit();
});


export default mongoose;