"use strict";
var Promise = require("bluebird");
var cheerio = require("cheerio");
var request = Promise.promisify(require("request"));
function getContent(url) {
    return Promise.try(function () {
        return request({
            url: url,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36" }
        }).then(function (response) {
            if (response.statusCode !== 200) {
                throw "request error, code: " + response.statusCode + ", message: " + response.statusMessage;
            }
            return cheerio.load(response.body);
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getContent;
//# sourceMappingURL=utils.js.map