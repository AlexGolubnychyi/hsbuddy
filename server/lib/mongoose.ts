
import * as mongoose from "mongoose";
import * as Promise from "bluebird";
let herokuMongoConnection = process.env.MONGOHQ_URL;

mongoose.connect(herokuMongoConnection || /*"mongodb://hsuser2:558222546@ds031915.mlab.com:31915/hsdb" || */"mongodb://localhost/hearthstonedb", {
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