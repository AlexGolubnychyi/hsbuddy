import * as Promise from "bluebird";
import * as cheerio from "cheerio";
import { IncomingMessage } from "http";
import * as request from "request";
// for debugging with fiddler
// let proxied = request.defaults({ proxy: "http://localhost:8888", strictSSL: false, followAllRedirects: true }), 

export var httpPost = Promise.promisify<IncomingMessage & { body: string }, request.OptionsWithUrl>(request.post);
export var httpGet = Promise.promisify<IncomingMessage & { body: string }, request.OptionsWithUrl>(request.get);
export { request };
export function getContent(url: string) {
    return Promise.try(() => {
        return httpGet({
            url,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36" }
        }).then(response => {
            if (response.statusCode !== 200) {
                throw `request error, url: ${url}, code: ${response.statusCode}, message: ${response.statusMessage}`;
            }

            return cheerio.load(response.body);
        });
    });
}

export function getJSON(url: string) {
    return Promise.try(() => {
        return httpGet({
            url,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36" }
        }).then(response => {
            if (response.statusCode !== 200) {
                throw `request error, url: ${url}, code: ${response.statusCode}, message: ${response.statusMessage}`;
            }

            return JSON.parse(response.body);
        });
    });
}




