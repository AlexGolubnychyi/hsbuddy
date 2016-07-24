import dbUtils, {DBDeck, DBCard} from "../db";

export abstract class BaseDeckParser {
    siteName: string;
    abstract parseDeck(url: string, save: boolean): Promise<any>;
    abstract parseDeckList(url: string, save: boolean): Promise<any>;
    abstract parse(url: string, save: boolean): Promise<any>;

    protected deckExistsUnsafe(deck: DBDeck) {
        let existingDecks = dbUtils.getDecks().find({ "hash": deck.hash });
        return !!(existingDecks && existingDecks.length);
    }

    protected addDeckUnsafe(name, url, cards: { [cardName: string]: number }) {
        let deck: DBDeck = {
            name: name.trim(),
            class: dbUtils.hsClasses.unknown,
            url: url,
            cost: 0,
            costApprox: false,
            cards: {},
            hash: ""
        };

        Object.keys(cards).map(cardName => {
            let cardId = dbUtils.generateCardId(cardName.trim()),
                count = cards[cardName],
                card = <DBCard>dbUtils.getCards().by("id", cardId);

            if (!card) {
                console.log(`[not found] card ${cardName}`);
                return null;
            }

            deck.cards[cardId] = count;
            if (deck.class === dbUtils.hsClasses.unknown && card.class !== dbUtils.hsClasses.neutral) {
                deck.class = card.class;
            }

            if (typeof card.cost === "undefined") {
                deck.costApprox = true;
            }
            else {
                deck.cost += card.cost * count;
            }
        });

        deck.hash = dbUtils.generateDeckHash(deck);
        if (this.deckExistsUnsafe(deck)) {
            console.log(`[skipped] deck ${deck.url} already exists in db`);
            return null;
        }
        dbUtils.getDecks().insert(deck);

        return deck;
    }
}