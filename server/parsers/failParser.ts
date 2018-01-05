import { BaseDeckParser } from './base/baseDeckParser';


class FailParser extends BaseDeckParser {
    name: '';

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
