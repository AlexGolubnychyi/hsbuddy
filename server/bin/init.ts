import mongoose from "../lib/mongoose";
import Card from "../db/card";
import parser from "../parsers";

Card.findOne().exec().then(card => {
    if (card === null) {
        console.log("db is empty => population");
        return parser.populateWithCards();
    }
})
.then(() => console.log("done with db"))
.then(() => process.exit());
