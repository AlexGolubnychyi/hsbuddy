
import * as hstypes from "../../interfaces/hs-types";
import * as Promise from "bluebird";
import { ParseError, ParseReportItem } from "./index";
import { ParseStatus } from "../../interfaces";
import Deck from "../db/deck";
import Card from "../db/card";

export abstract class BaseDeckParser {
    abstract parse(userId: string, url: string, save: boolean): Promise<ParseReportItem[]>;
    abstract canParse(url: string): boolean;

    protected addDeckUnsafe(userId: string, name: string, url: string, cards: { [cardName: string]: number }, date?: Date) {
        let cardNames = Object.keys(cards),
            deck = new Deck();
        deck._id = Deck.generateId(cards);
        deck.name = name.trim();
        deck.url = url;
        deck.class = hstypes.CardClass.unknown;
        deck.cost = 0;
        deck.dateAdded = (date && !isNaN(date.valueOf())) ? date : new Date();
        deck.userId = userId;

        return Deck.findById(deck._id).exec()
            .then(existing => {
                if (existing) {
                    return Promise.reject(new ParseError("", ParseStatus.duplicate, url, existing.id));
                }
            })
            .then(() => Promise.map(cardNames, cardName => Card.findById(Card.generateId(cardName))))
            .then(cardDbs => {
                for (let i = 0; i < cardNames.length; i++) {
                    let card = cardDbs[i];
                    if (card === null) {
                        return Promise.reject(new ParseError(`card not found: ${cardNames[i]}`, ParseStatus.fail, url));
                    }
                    deck.cards.push({
                        card: card.id,
                        count: cards[cardNames[i]]
                    });
                    deck.cost += card.cost * cards[cardNames[i]];
                    if (!deck.class && card.class !== hstypes.CardClass.neutral) {
                        deck.class = card.class;
                    }
                }
            })
            .then(() => {
                let cardTotal = deck.cards.reduce((acc, card) => acc + card.count, 0);
                if (cardTotal !== 30) {
                    return Promise.reject(new ParseError(`deck malformed: card amount is ${cardTotal} instead of 30`, ParseStatus.fail, url));
                }
            })
            .then(() => Deck.findOne({ "url": deck.url }))
            .then(existing => {
                if (!existing) {
                    return deck.save().then(() => <ParseReportItem>{ status: ParseStatus.success, reason: "", url, id: deck.id });
                }

                return Deck.upgradeDeck(existing, deck).then(() => <ParseReportItem>{ status: ParseStatus.upgrade, reason: "", url, id: deck.id });
            })
            .catch((rejection: Error | ParseError) => {
                if (rejection instanceof ParseError) {
                    return rejection.getParseStatusReportItem();
                }
                return <ParseReportItem>{ status: ParseStatus.fail, reason: rejection.message, url };
            });
    }

    protected reportUnrecognized(url) {
        return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url, reason: "url not recognized" }]);
    }

    protected reportParserNotFound(url) {
        return Promise.resolve([<ParseReportItem>{ status: ParseStatus.fail, url: url, reason: "url not supported" }]);
    }
}