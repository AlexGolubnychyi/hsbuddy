import * as urlHelper from 'url';
import * as hstypes from '../../../interfaces/hs-types';
import * as Promise from 'bluebird';
import { HttpError } from '../../error';
import { ParseError, ParseReportItem } from '../index';
import { ParseStatus } from '../../../interfaces';
import Deck, { DeckDB } from '../../db/deck';
import { cardDB } from '../../db/card';
import { deckEncoder, DeckEncoderError } from '../../db/utils/deckEncoder';
import { CardCount } from '../../../interfaces/index';



export abstract class BaseDeckParser {
    abstract name: string;
    protected parserNotFound = false;
    abstract canParse(url: string): boolean;
    protected abstract getDeckData(url: string): Promise<DeckData[]>;

    protected urlClean(url: string) {
        const prefix = 'http://';
        if (!/https?:\/\//.test(url)) {
            return prefix + url;
        }
        return url;
    }


    parse(userId: string, url: string, upgradeDeckId?: string) {
        if (this.parserNotFound) {
            return this.reportParserNotFound(url);
        }

        if (!this.canParse(url)) {
            return this.reportUnrecognized(url);
        }

        return this
            .getDeckData(this.urlClean(url))
            .then(decksData => {
                if (upgradeDeckId && decksData.length !== 1) {
                    return Promise.resolve([<ParseReportItem>{
                        parserName: this.name, status: ParseStatus.fail, url,
                        reason: 'upgrade url should point to exactly one deck'
                    }]);
                }
                return Promise.map(decksData, deckData => this.addDeckUnsafe(userId, deckData, upgradeDeckId));
            })
            .catch(error => {
                if (error instanceof HttpError) {
                    const reason = `provided url seems to be invalid, status code: ${error.status}`;
                    return Promise.resolve([<ParseReportItem>{ parserName: this.name, status: ParseStatus.fail, url, reason }]);
                }
                if (error instanceof DeckEncoderError) {
                    return Promise.resolve(<ParseReportItem>{ parserName: this.name, status: ParseStatus.fail, url, reason: error.message });
                }
                // let's try to be open about errors since I know all the users personally :)
                const msg = error instanceof Error
                    ? error.message
                    : typeof error === 'string'
                        ? error
                        : 'internal error';
                return Promise.resolve(<ParseReportItem>{ parserName: this.name, status: ParseStatus.fail, url, reason: msg });
            });
    }

    protected addDeckUnsafe(userId: string, deckData: DeckData, upgradeDeckId?: string): Promise<ParseReportItem> {
        if (Array.isArray(deckData.cards)) {
            deckData.cards = deckData.cards.reduce((acc, cur) => (acc[cur.card] = cur.count, acc), {});
        }

        const cardNames = Object.keys(deckData.cards),
            deck = new Deck() as DeckDB<string>;
        deck._id = Deck.generateId(deckData.cards);
        deck.name = deckData.name.trim();
        deck.url = deckData.url;
        deck.class = hstypes.CardClass.unknown;
        deck.cost = 0;
        deck.dateAdded = (deckData.date && !isNaN(deckData.date.valueOf())) ? deckData.date : new Date();
        deck.userId = userId;
        deck.standart = true;

        return Deck.findById(deck.id).exec()
            .then(existing => { // check for duplicate, update it if needed
                if (!existing) {
                    return;
                }

                if (existing.deleted) {
                    return existing.remove();
                }

                if (existing.url && deck.url && existing.url !== deck.url
                    && urlHelper.parse(existing.url).host === urlHelper.parse(deck.url).host) {
                    // still mark as duplicate but update url (to deal with that nasty habit of tempostorm to change deck urls,
                    // thus breakig old references)
                    existing.url = deck.url;
                    return existing.save().then(() => Promise.reject(new ParseError({
                        parserName: this.name, reason: '', status: ParseStatus.duplicate, url: deckData.url, id: existing.id
                    })));
                }

                return Promise.reject(new ParseError({
                    parserName: this.name, reason: '', status: ParseStatus.duplicate, url: deckData.url, id: existing.id
                }));
            })
            .then(() => Promise.map(cardNames, cardName => cardDB.findById(cardDB.generateId(cardName))))
            .then(cardDbs => {
                for (let i = 0; i < cardNames.length; i++) {
                    const card = cardDbs[i];
                    if (card === null) {
                        return Promise.reject(new ParseError({
                            parserName: this.name, reason: `card not found: ${cardNames[i]}`, status: ParseStatus.fail, url: deckData.url
                        }));
                    }
                    deck.cards.push({
                        card: card.id,
                        count: deckData.cards[cardNames[i]]
                    });
                    deck.cost += card.cost * deckData.cards[cardNames[i]];
                    if (!deck.class && card.class !== hstypes.CardClass.neutral) {
                        deck.class = card.class;
                    }
                    if (!hstypes.hsTypeConverter.isStandart(card)) {
                        deck.standart = false;
                    }
                }

                deck.importCode =
                    deckEncoder.encode(deck.class, deck.standart, deck.cards.map(c => ({ count: c.count, card: cardDbs.find(cdb => cdb.id === c.card) })));
            })
            .then(() => {
                const cardTotal = deck.cards.reduce((acc, card) => acc + card.count, 0);
                if (cardTotal !== 30) {
                    return Promise.reject(new ParseError({
                        parserName: this.name, reason: `deck malformed: card amount is ${cardTotal} instead of 30`, status: ParseStatus.fail, url: deckData.url
                    }));
                }
            })
            .then(() => Deck.findOne({ '$or': [{ 'url': (deck.url || 'ignore_those_missing_url') }, { '_id': upgradeDeckId || '' }] }))
            .then((existing: DeckDB<string>) => {
                if (!existing) {
                    if (upgradeDeckId) {
                        return Promise.reject(new ParseError({
                            parserName: this.name, reason: 'could not find deck to upgrade', status: ParseStatus.fail, url: deckData.url, id: upgradeDeckId
                        }));
                    }
                    return deck.save().then(() => <ParseReportItem>{
                        parserName: this.name, status: ParseStatus.success, reason: '', url: deckData.url, id: deck.id
                    });
                }
                const status = upgradeDeckId ? ParseStatus.success : ParseStatus.upgrade;
                return Deck.upgradeDeck(existing, deck)
                    .then(() => <ParseReportItem>{ parserName: this.name, status, reason: '', url: deckData.url, id: deck.id });
            })
            .catch((rejection: Error | ParseError) => {
                if (rejection instanceof ParseError) {
                    return rejection.getParseStatusReportItem();
                }
                return <ParseReportItem>{ parserName: this.name, status: ParseStatus.fail, reason: rejection.message, url: deckData.url };
            });
    }

    protected reportUnrecognized(url: string) {
        return Promise.resolve([<ParseReportItem>{ parserName: '', status: ParseStatus.fail, url, reason: 'url not recognized' }]);
    }

    protected reportParserNotFound(url: string) {
        return Promise.resolve([<ParseReportItem>{ parserName: '', status: ParseStatus.fail, url: url, reason: 'url not supported' }]);
    }
}

export interface DeckData {
    name: string;
    url: string;
    cards: { [cardName: string]: number } | CardCount<string>[];
    date?: Date;
}
