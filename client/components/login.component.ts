import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { AuthService } from "../services/auth.service";

@Component({
    moduleId: module.id,
    selector: "login",
    templateUrl: "login.component.html"
})
export class LoginComponent implements OnInit {
    form: FormGroup;
    error: string;
    loading = false;

    constructor(private authService: AuthService, private fb: FormBuilder) { }

    ngOnInit() {
        this.form = this.fb.group({
            "username": ["", Validators.required],
            "password": ["", Validators.required]
        });
    }

    login() {
        this.loading = true;
        this.authService.login(this.form.value).subscribe(result => {
            this.error = result.error;
            this.loading = false;
        });
    }

    register() {
        this.loading = true;
        this.authService.register(this.form.value).subscribe(result => {
            this.error = result.error;
            this.loading = false;
        });
    }
}