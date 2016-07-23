import * as util from "util";
import * as http from "http";

export function HttpError(status, message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);

    this.status = status;
    this.message = message || http.STATUS_CODES[status] || "Error";
}

util.inherits(HttpError, Error);

HttpError.prototype.name = "HttpError";


export function AuthError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);

    this.message = message;
}

util.inherits(AuthError, Error);

AuthError.prototype.name = "AuthError";