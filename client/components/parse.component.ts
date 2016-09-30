import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ApiService } from "../services/api.service";
import * as contracts from "../../interfaces/index";

@Component({
    moduleId: module.id,
    templateUrl: "parse.component.html"
})
export class ParseComponent implements OnInit {
    form: FormGroup;
    loading = false;
    status = contracts.ParseStatus;
    results: contracts.ParseResult[];

    constructor(private deckService: ApiService, private fb: FormBuilder) { }

    ngOnInit() {
        this.form = this.fb.group({
            "links": ["", Validators.required],
        });
    }

    parse() {
        this.loading = true;
        this.results = null;
        this.deckService.parseUrls(this.form.value)
            .subscribe(resp => {
                this.results = resp.sort((r1, r2) => r1.status - r2.status);
                this.loading = false;
            });
    }

    format(result: contracts.ParseResult) {
        if (result.error) {
            return `[${result.error}] ${result.url}`;
        }
        return `[${contracts.ParseStatus[result.status]}] ${result.url}`;
    }

}