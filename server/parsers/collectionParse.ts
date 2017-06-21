import { httpGet, httpPost, request } from "../lib/request";
import * as Promise from "bluebird";
import * as cheerio from "cheerio";
import * as querystring from "querystring";
import mongoose from "../lib/mongoose";
import UserCard from "../db/userCard";
import { cardDB } from "../db/card";
import { CardCount } from "../../interfaces";

const userNameToken = "@username@",
    landingUrl = "http://www.hearthpwn.com",
    loginCurseUrl = "https://www.hearthpwn.com/curse-login",
    loginOriginalUrl = "https://www.hearthpwn.com/login",
    collectionUrl = `http://www.hearthpwn.com/members/${userNameToken}/collection`,
    passwordAlias = "field-loginFormPassword",
    userNameAlis = "field-username",
    securityFieldIds = ["field-returnUrl", "field-security-token", "field-authenticity-token", "field-username", "field-loginFormPassword"],
    basicHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2799.0 Safari/537.36",
        "Host": "www.hearthpwn.com",
        "Connection": "keep-alive",
        "Referer": " https://www.hearthpwn.com/curse-login"
    };

export default function (userId: string, username: string, password: string) {
    return getHearthPwnCollectionPageBody(username, password)
        .then($ => {
            let cardCountHash: { [index: string]: CardCount<string> } = {},
                withErrors = false;

            $(".card-image-item").map((inx, el) => {
                let $el = $(el),
                    name = $el.attr("data-card-name"),
                    count = +$el.find(".inline-card-count").attr("data-card-count"),
                    cardId = cardDB.generateId(name);

                if (!name) {
                    withErrors = true;
                }
                //hearthpwn keeps regular and golden cards separately, need to merge
                if (cardCountHash[cardId]) {
                    cardCountHash[cardId].count += count;
                }
                else {
                    cardCountHash[cardId] = {
                        card: cardId,
                        count
                    };
                }
            });

            if (withErrors) {
                return Promise.reject("error while parsing collection, please contact me");
            }

            return Object.keys(cardCountHash).map(key => cardCountHash[key]);
        })
        .then((cardCounts: CardCount<string>[]) => {
            if (!cardCounts.length) {
                return Promise.reject("username/password invalid or collection is empty");
            }

            return UserCard.import(userId, cardCounts);
        });

}

function getHearthPwnCollectionPageBody(username: string, password: string) {
    const cookieJar = request.jar();
    return httpGet({ url: landingUrl, jar: cookieJar, headers: basicHeaders })
        .then(() => httpGet({ url: loginOriginalUrl, jar: cookieJar, headers: basicHeaders }))
        .then(() => httpGet({ url: loginCurseUrl, jar: cookieJar, headers: basicHeaders }))
        .then(response => {
            let loginParams: { [index: string]: string } = {},
                $ = cheerio.load(response.body);
            $(securityFieldIds.map(f => "#" + f).join(",")).each((inx, el) => {
                let id = $(el).attr("id"),
                    name = $(el).attr("name"),
                    value = $(el).attr("value");
                switch (id) {
                    case userNameAlis:
                        value = username;
                        break;
                    case passwordAlias:
                        value = password;
                        break;
                }
                loginParams[name] = value;
            });
            return loginParams;
        })
        .then(loginParams => httpPost({
            url: loginOriginalUrl,
            jar: cookieJar,
            body: querystring.stringify(loginParams),
            headers: Object.assign({}, basicHeaders, {
                "Content-Type": "application/x-www-form-urlencoded"
            })
        }))
        .then(() => httpGet({
            url: collectionUrl.replace(userNameToken, username),
            jar: cookieJar
        }))
        .then((response) => cheerio.load(response.body));
};
