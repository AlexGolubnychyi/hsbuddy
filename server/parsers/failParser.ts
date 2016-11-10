import { BaseDeckParser } from "./baseDeckParser";
class FailParser extends BaseDeckParser {

    constructor() {
        super();
        this.parserNotFound = true;
    }

    canParse(url: string) {
        return true;
    }

    getDeckData(url: string): null {
        return null;
    }
}
export default new FailParser();