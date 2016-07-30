import * as Promise from "bluebird";
import * as cheerio from "cheerio";

let request = <any>Promise.promisify(require("request")) as (p: {}) => Promise<{ statusCode: any, statusMessage: any, body: any }>;

export default function getContent(url) {
    return Promise.try(() => {
        return request({
            url,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36" }
        }).then(response => {
            if (response.statusCode !== 200) {
                throw `request error, code: ${response.statusCode}, message: ${response.statusMessage}`;
            }

            return cheerio.load(response.body);
        });
    });
}

export function getJSON(url): Promise<any> {
    return Promise.try(() => {
        return request({
            url,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36" }
        }).then(response => {
            if (response.statusCode !== 200) {
                throw `request error, code: ${response.statusCode}, message: ${response.statusMessage}`;
            }

            return JSON.parse(response.body);
        });
    });
}


