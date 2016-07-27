
import * as mongoose from "mongoose";
import * as Promise from "bluebird";
let herokuMongoConnection = process.env.MONGOHQ_URL;

mongoose.connect(herokuMongoConnection || "mongodb://localhost/hearthstonedb", {
    "server": {
        socketOptions: {
            keepAlive: 1
        }
    }
}, function (err) {
    if (err) {
        console.log("couldn't connect to db");
        throw err;
    }
});
mongoose.Promise = Promise;


export default mongoose;