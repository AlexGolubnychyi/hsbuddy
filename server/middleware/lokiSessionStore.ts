import * as loki from "lokijs";
import * as fs from "fs";
import * as Promise from "bluebird";
let writeFile = Promise.promisify(fs.writeFile) as (name, data, options) => Promise<{}>;


class LokiSessionStore {
    sessions: LokiCollection<DBSession>;
    initialized: boolean;

    static create(dbFileName: string, session) {
        //5am approach:
        return Object.assign(Object.create(session.Store.prototype), new LokiSessionStore(dbFileName));
    }

    constructor(dbFileName) {
        writeFile(dbFileName, "", { flag: "wx" })//create if doesn't exist
            .catch(() => {console.log("session bd exists")})
            .then(() => {
                let db = new loki(dbFileName, {
                    autosave: true,
                    autosaveInterval: 10000
                });

                db.loadDatabase({}, () => {
                    this.sessions = db.getCollection<DBSession>("Sessions");

                    if (!this.sessions) {
                        this.sessions = db.addCollection<DBSession>("Sessions", {
                            unique: ["sid"]
                        });
                    }
                    this.initialized = true;
                });
            });
    }

    on = (evt, callback) => {
        console.log(new Date(), "loki-session event: ", evt);
        if (callback) {
            callback.call(this);
        }
    }

    get = (sid, callback) => {
        if (!this.initialized) {
            callback(null);
            return;
        }

        let sess = this._get(sid);
        callback(null, sess && sess.session);
    }

    set = (sid, session: {}, callback) => {
        if (this.initialized) {
            this._remove(sid);
            this.sessions.insert(<DBSession>{
                sid: sid,
                session: session,
                createdAt: new Date()
            });
        }
        callback(null);

    }

    destroy = (sid, callback) => {
        if (this.initialized) {
            this._remove(sid);
        }
        callback(null);
    }

    length = (callback) => {
        return (this.sessions && this.sessions.data) ? this.sessions.data.length : 0;
    }

    clear = (callback) => {
        // TODO
    }

    private _remove = (sid: string) => {
        let entry = this._get(sid);
        if (entry) {
            this.sessions.remove(entry);
        }
    }

    private _get = (sid: string) => {
        return this.sessions.by("sid", sid);
    }
}

export default LokiSessionStore.create;

interface DBSession {
    sid: string;
    session: string;
    createdAt: Date;
}

// mandatory
// .get(sid, callback)
// .set(sid, session, callback)
// .destroy(sid, callback)
// Recommended methods include, but are not limited to:
//
// .length(callback)
// .clear(callback)
