
import * as hstypes from "../../interfaces/hs-types";
import * as Promise from "bluebird";
import {ParseReportItem, ParseStatus} from "./index";
import Deck from "../db/deck";
import Card from "../db/card";

export abstract class BaseDeckParser {
    siteName: string;
    abstract parseDeck(userId: string, url: string, save: boolean): Promise<ParseReportItem>;
    abstract parseDeckList(userId: string, url: string, save: boolean): Promise<ParseReportItem[]>;
    abstract parse(userId: string, url: string, save: boolean): Promise<ParseReportItem[]>;

    protected addDeckUnsafe(userId: string, name: string, url: string, cards: { [cardName: string]: number }) {
        let cardNames = Object.keys(cards),
            deck = new Deck();
        deck._id = Deck.generateId(cards);
        deck.name = name.trim();
        deck.url = url;
        deck.class = hstypes.CardClass.unknown;
        deck.cost = 0;
        deck.dateAdded = new Date();
        deck.userId = userId;

        return Deck.findById(deck._id).exec()
            .then(existing => {
                if (existing) {
                    return Promise.reject({ status: ParseStatus.duplicate, reason: "", url: url });
                }
            })
            .then(() => Promise.map(cardNames, cardName => Card.findById(Card.generateId(cardName))))
            .then(cardDbs => {
                for (let i = 0; i < cardNames.length; i++) {
                    let card = cardDbs[i];
                    if (card === null) {
                        return Promise.reject({ status1: ParseStatus.failed, reason: `card not found: ${card.name}`, url: url });
                    }
                    deck.cards.push({
                        card: card._id,
                        count: cards[cardNames[i]]
                    });
                    deck.cost += card.cost * cards[cardNames[i]];
                    if (!deck.class && card.class !== hstypes.CardClass.neutral) {
                        deck.class = card.class;
                    }
                }
            })
            .then(() => deck.save())
            .then(() => {
                return <ParseReportItem>{ status: ParseStatus.success, reason: "", url: url };
            })
            .catch((rejection: ParseReportItem) => {
                return rejection;
            });
    }
}