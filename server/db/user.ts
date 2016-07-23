"use strict";

import dbUtils, {DBUser} from "./index";
import * as crypto from "crypto";
import {AuthError} from "../error";

class UserUtils {
    static salt = "everything is better with salt";

    auth(userId, password) {
        return dbUtils.getDb().then(db => {
            let user = <DBUser>db.getCollection(dbUtils.collections.user).by("userId", userId);
            if (!user || this.encrypt(password) !== user.hash) {
                return Promise.reject(new AuthError("invalid username or password"));
            }
        });
    }

    createUser(userId, password) {
        userId = userId && userId.trim();
        password = password && password.trim();
        if (!userId || !password) {
             return Promise.reject(new AuthError("Cannot create user: name/password cannot be empty"));
        }
        return dbUtils.getDb().then(db => {
            let users = db.getCollection(dbUtils.collections.user);
            let user = <DBUser>users.by("userId", userId);
            if (user) {
                 return Promise.reject(new AuthError("Cannot create user: user already exists"));
            }
            user = {
                userId,
                hash: this.encrypt(password)
            };
            users.insert(user);
        }).then(() => dbUtils.saveDb());
    }

    private encrypt(password: string) {
        return crypto.createHmac("sha1", UserUtils.salt).update(password).digest("hex");
    }
}

export default new UserUtils();