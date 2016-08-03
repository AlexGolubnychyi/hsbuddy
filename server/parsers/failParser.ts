import {BaseDeckParser} from "./baseDeckParser";
class FailParser extends BaseDeckParser {

    canParse(url: string) {
        return true;
    }

    parse(userId: string, url: string, save: boolean) {
        return this.reportParserNotFound(url);
    }
}
export default new FailParser();