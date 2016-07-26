import dbUtils, {DBDeck, DBCard} from "../db";
import * as hstypes from "../../interfaces/hs-types";
import {ParseReportItem, ParseStatus} from "./index";
export abstract class BaseDeckParser {
    siteName: string;
    abstract parseDeck(url: string, save: boolean): Promise<ParseReportItem>;
    abstract parseDeckList(url: string, save: boolean): Promise<ParseReportItem[]>;
    abstract parse(url: string, save: boolean): Promise<ParseReportItem[]>;

    protected deckExistsUnsafe(deck: DBDeck) {
        let existingDecks = dbUtils.getDecks().find({ "id": deck.id });
        return !!(existingDecks && existingDecks.length);
    }

    protected addDeckUnsafe(name, url, cards: { [cardName: string]: number }): [DBDeck, ParseReportItem] {
        let deck: DBDeck = {
            id: "",
            name: name.trim(),
            class: hstypes.CardClass.unknown,
            url: url,
            cost: 0,
            costApprox: false,
            cards: {}
        }

        Object.keys(cards).map(cardName => {
            let cardId = dbUtils.generateCardId(cardName.trim()),
                count = cards[cardName],
                card = <DBCard>dbUtils.getCards().by("id", cardId);

            if (!card) {
                //console.log(`[not found] card ${cardName}`);
                return [null, { status1: ParseStatus.failed, reason: `card not found: ${card.name}`, url: url }];
            }

            deck.cards[cardId] = count;
            if (deck.class === hstypes.CardClass.unknown && card.class !== hstypes.CardClass.neutral) {
                deck.class = card.class;
            }

            if (typeof card.cost === "undefined") {
                deck.costApprox = true;
            }
            else {
                deck.cost += card.cost * count;
            }
        });

        deck.id = dbUtils.generateDeckId(deck);
        if (this.deckExistsUnsafe(deck)) {
            return [null, { status: ParseStatus.duplicate, reason: "", url: url }];
        }
        dbUtils.getDecks().insert(deck);
        return [deck, { status: ParseStatus.success, reason: "", url: url }];
    }
}