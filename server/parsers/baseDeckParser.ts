import * as urlHelper from "url";
import * as hstypes from "../../interfaces/hs-types";
import * as Promise from "bluebird";
import { HttpError } from "../error";
import { ParseError, ParseReportItem } from "./index";
import { ParseStatus } from "../../interfaces";
import Deck, { DeckDB } from "../db/deck";
import Card from "../db/card";

export abstract class BaseDeckParser {

    abstract canParse(url: string): boolean;
    protected abstract getDeckData(url: string): Promise<DeckData[]>;

    protected parserNotFound = false;


    parse(userId: string, url: string, upgradeDeckId?: string): Promise<ParseReportItem[]> {
        if (this.parserNotFound) {
            return this.reportParserNotFound(url);
        }

        if (!this.canParse(url)) {
            return this.reportUnrecognized(url);
        }

        return this
            .getDeckData(url)
            .then(decksData => {
                if (upgradeDeckId && decksData.length !== 1) {
                    return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url, reason: "upgrade url should point to exactly one deck" }]);
                }
                return Promise.map(decksData, deckData => this.addDeckUnsafe(userId, deckData, upgradeDeckId));
            })
            .catch(error => {
                if (error instanceof HttpError) {
                    let reason = `provided url seems to be invalid, status code: ${error.status}`;
                    return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url, reason }]);
                }
                return Promise.resolve(<ParseReportItem>{ status: ParseStatus.fail, url, reason: `internal error` });
            });
    }

    protected addDeckUnsafe(userId: string, deckData: DeckData, upgradeDeckId?: string): Promise<ParseReportItem> {
        let cardNames = Object.keys(deckData.cards),
            deck = new Deck() as DeckDB<string>;
        deck._id = Deck.generateId(deckData.cards);
        deck.name = deckData.name.trim();
        deck.url = deckData.url;
        deck.class = hstypes.CardClass.unknown;
        deck.cost = 0;
        deck.dateAdded = (deckData.date && !isNaN(deckData.date.valueOf())) ? deckData.date : new Date();
        deck.userId = userId;

        return Deck.findById(deck.id).exec()
            .then(existing => {
                if (!existing) {
                    return;
                }

                if (existing.deleted) {
                    return existing.remove();
                }

                if (existing.url !== deck.url && urlHelper.parse(existing.url).host === urlHelper.parse(deck.url).host) {
                    //still mark as duplicate but update url (to deal with that nasty habit of tempostorm to change deck urls, 
                    //thus breakig old references)
                    existing.url = deck.url;
                    return existing.save().then(() => Promise.reject(new ParseError("", ParseStatus.duplicate, deckData.url, existing.id)));
                }

                return Promise.reject(new ParseError("", ParseStatus.duplicate, deckData.url, existing.id));
            })
            .then(() => Promise.map(cardNames, cardName => Card.findById(Card.generateId(cardName))))
            .then(cardDbs => {
                for (let i = 0; i < cardNames.length; i++) {
                    let card = cardDbs[i];
                    if (card === null) {
                        return Promise.reject(new ParseError(`card not found: ${cardNames[i]}`, ParseStatus.fail, deckData.url));
                    }
                    deck.cards.push({
                        card: card.id,
                        count: deckData.cards[cardNames[i]]
                    });
                    deck.cost += card.cost * deckData.cards[cardNames[i]];
                    if (!deck.class && card.class !== hstypes.CardClass.neutral) {
                        deck.class = card.class;
                    }
                }
            })
            .then(() => {
                let cardTotal = deck.cards.reduce((acc, card) => acc + card.count, 0);
                if (cardTotal !== 30) {
                    return Promise.reject(new ParseError(`deck malformed: card amount is ${cardTotal} instead of 30`, ParseStatus.fail, deckData.url));
                }
            })
            .then(() => Deck.findOne({ "$or": [{ "url": deck.url }, { "_id": upgradeDeckId || "" }] }))
            .then((existing: DeckDB<string>) => {
                if (!existing) {
                    if (upgradeDeckId) {
                        return Promise.reject(new ParseError("could not find deck to upgrade", ParseStatus.fail, deckData.url, upgradeDeckId));
                    }
                    return deck.save().then(() => <ParseReportItem>{ status: ParseStatus.success, reason: "", url: deckData.url, id: deck.id });
                }
                let status = upgradeDeckId ? ParseStatus.success : ParseStatus.upgrade;
                return Deck.upgradeDeck(existing, deck)
                    .then(() => <ParseReportItem>{ status, reason: "", url: deckData.url, id: deck.id });
            })
            .catch((rejection: Error | ParseError) => {
                if (rejection instanceof ParseError) {
                    return rejection.getParseStatusReportItem();
                }
                return <ParseReportItem>{ status: ParseStatus.fail, reason: rejection.message, url: deckData.url };
            });
    }

    protected reportUnrecognized(url: string) {
        return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url, reason: "url not recognized" }]);
    }

    protected reportParserNotFound(url: string) {
        return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url: url, reason: "url not supported" }]);
    }
}

export interface DeckData {
    name: string;
    url: string;
    cards: { [cardName: string]: number };
    date?: Date;
}