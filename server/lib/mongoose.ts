
import * as mongoose from "mongoose";
import * as Promise from "bluebird";
let connection  = process.env.NODE_ENV === "prod" ? "mongodb://hsuser2:558222546@ds031915.mlab.com:31915/hsdb" : "mongodb://localhost/hearthstonedb";

mongoose.connect(connection, {
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
//wrong mongoose typings
(mongoose as any).Promise = Promise;


export default mongoose;