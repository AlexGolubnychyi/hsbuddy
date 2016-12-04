"use strict";

import * as crypto from "crypto";
import { AuthError } from "../error";
import mongoose from "../lib/mongoose";
import Deck, { DeckDB, deckSchemaName } from "./deck";
import { CardDB } from "./card";
import * as contracts from "../../interfaces";
import * as Promise from "bluebird";

const salt = "everything is better with salt";

const userSchema = new mongoose.Schema({
    _id: String,
    passwordHash: String,
    decks: [{ type: String, ref: deckSchemaName }],
    latestActivityDate: Date
});


let userActivityCache: { [userId: string]: boolean } = {};

userSchema.static("encrypt", (password: string) => crypto.createHmac("sha1", salt).update(password).digest("hex"));

userSchema.static("auth", function (userId: string, password: string) {
    userId = userId && userId.toLowerCase().trim();
    let model = (this as mongoose.Model<UserDB> & UserStatics);
    return model
        .findById(userId).exec()
        .then(user => {
            if (!user || model.encrypt(password) !== user.passwordHash) {
                return <any>Promise.reject(new AuthError("invalid username or password"));
            }

            return user.save().then(() => user);
        });
});

userSchema.static("loadUser", function (userId: string) {
    let model = (this as mongoose.Model<UserDB> & UserStatics);
    return model.findById(userId).then(user => {
        if (userActivityCache[userId] || !user) {
            return user;
        }
        //dates will keep updating cause heroku restarts server all the time
        user.latestActivityDate = new Date();
        userActivityCache[userId] = true;
        return user.save();
    });
});

userSchema.static("createUser", function (userId: string, password: string) {
    let model = (this as mongoose.Model<UserDB> & UserStatics);
    userId = userId && userId.toLowerCase().trim();
    password = password && password.trim();
    if (!userId || !password) {
        return Promise.reject(new AuthError("Cannot create user: name/password cannot be empty"));
    }

    return model.findById(userId).exec().then(user => {
        if (user) {
            return <any>Promise.reject(new AuthError("Cannot create user: user already exists"));
        }

        user = new model();
        user._id = userId;
        user.passwordHash = model.encrypt(password);
        return user.save().then(() => user);
    });
});

userSchema.static("getUserDeckIds", function (userId: string) {
    let model = (this as mongoose.Model<UserDB> & UserStatics);
    if (!userId) {
        return Promise.resolve([]);
    }

    return model.findById(userId).exec().then(user => {
        if (!user || !user.decks) {
            return [];
        }
        return user.decks.slice();
    });
});

userSchema.static("setUserDeck", function (userId: string, deckId: string, set: boolean) {
    let model = (this as mongoose.Model<UserDB> & UserStatics),
        result: contracts.CollectionChangeStatus = {
            collection: set,
            success: true,
            deckDeleted: false
        };

    return model.findById(userId).exec().then(user => {
        let decks = user.decks as string[],
            index = decks.indexOf(deckId);

        if (set) {
            if (index >= 0) {
                return result;
            }
            decks.push(deckId);
            return user.save().then(() => result);
        }

        if (index < 0) {
            return result;
        }

        decks.splice(index, 1);
        return user.save().then(() => Deck.recycle(deckId)).then(rez => {
            result.deckDeleted = rez;
            return result;
        });
    });
});


export interface UserDB extends mongoose.Document {
    _id: string;
    passwordHash: string;
    decks: string[] | DeckDB<string | CardDB>[];
    latestActivityDate: Date;
}

interface UserStatics {
    encrypt: (password: string) => string;
    auth: (userId: string, password: string) => Promise<UserDB>;
    createUser: (userId: string, password: string) => Promise<UserDB>;
    getUserDeckIds: (userId: string) => Promise<string[]>;
    setUserDeck: (userId: string, deckId: string, set: boolean) => Promise<contracts.CollectionChangeStatus>;
    loadUser: (userId: string) => Promise<UserDB>;
}
export const userSchemaName = "User";
export default mongoose.model<UserDB>(userSchemaName, userSchema) as mongoose.Model<UserDB> & UserStatics;