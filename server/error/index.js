"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var http = require("http");
var HttpError = (function (_super) {
    __extends(HttpError, _super);
    function HttpError(status, message) {
        _super.call(this, message);
        this.status = status;
        this.message = message;
        this.name = "HttpError";
        Error.captureStackTrace(this, HttpError);
        this.message = message || http.STATUS_CODES[status] || "Error";
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
var AuthError = (function (_super) {
    __extends(AuthError, _super);
    function AuthError(message) {
        _super.call(this, message);
        this.message = message;
        this.name = "AuthError";
        Error.captureStackTrace(this, AuthError);
    }
    return AuthError;
}(Error));
exports.AuthError = AuthError;
var UnAuthorizedError = (function (_super) {
    __extends(UnAuthorizedError, _super);
    function UnAuthorizedError() {
        _super.call(this, 401, "action is not authorized.");
        this.name = "UnAuthorizedError";
        Error.captureStackTrace(this, UnAuthorizedError);
    }
    return UnAuthorizedError;
}(HttpError));
exports.UnAuthorizedError = UnAuthorizedError;
//# sourceMappingURL=index.js.map