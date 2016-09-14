"use strict";

import * as crypto from "crypto";
import { AuthError } from "../error";
import mongoose from "../lib/mongoose";
import Deck, { DeckDB, deckSchemaName } from "./deck";
import * as contracts from "../../interfaces";

const salt = "everything is better with salt";

const userSchema = new mongoose.Schema({
    _id: String,
    passwordHash: String,
    decks: [{ type: String, ref: deckSchemaName }]
});

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

            return Promise.resolve(user);
        });
});

userSchema.static("createUser", function (userId: string, password) {
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

userSchema.static("getUserDeckIds", function (userId) {
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

userSchema.static("setUserDeck", function (userId, deckId, set: boolean) {
    let model = (this as mongoose.Model<UserDB> & UserStatics),
        result: contracts.CollectionChangeStatus = {
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
    decks: string[] | DeckDB[];
}

interface UserStatics {
    encrypt: (password: string) => string;
    auth: (userId: string, password) => Promise<UserDB>;
    createUser: (userId: string, password) => Promise<UserDB>;
    getUserDeckIds: (userId: string) => Promise<string[]>;
    setUserDeck: (userId: string, deckId: string, set: boolean) => Promise<contracts.CollectionChangeStatus>;
}
export const userSchemaName = "User";
export default mongoose.model<UserDB>(userSchemaName, userSchema) as mongoose.Model<UserDB> & UserStatics;