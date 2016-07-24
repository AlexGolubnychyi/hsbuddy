import dbUtils, {DBDeck} from "../db";

export abstract class BaseDeckParser {
    siteName: string;
    abstract parseDeck(url: string, save: boolean): Promise<any>;
    abstract parseDeckList(url: string, save: boolean): Promise<any>;
    abstract parse(url: string, save: boolean): Promise<any>;

    protected deckExists(deck: DBDeck) {
        dbUtils.ensureDb().then(() => {
            let existingDecks = dbUtils.getDecks().find({ "hash": deck.hash });
            return existingDecks && existingDecks.length;
        });
    }
}