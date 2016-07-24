import * as util from "util";
import * as http from "http";


export class HttpError extends  Error {
    name = "HttpError";

    constructor(public status, public message) {
        super(message);
        Error.captureStackTrace(this, HttpError);
        this.message = message || http.STATUS_CODES[status] || "Error";
    }
}

export class AuthError extends  Error {
    name = "AuthError";

    constructor(public message) {
        super(message);
        Error.captureStackTrace(this, AuthError);
    }
}

export class UnAuthorizedError extends HttpError {
    name = "UnAuthorizedError";

    constructor() {
        super(401, "action is not authorized.");
        Error.captureStackTrace(this, UnAuthorizedError);
    }
}