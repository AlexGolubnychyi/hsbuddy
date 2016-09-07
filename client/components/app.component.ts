import { Component } from "@angular/core";
import { AuthService } from "../services/auth.service";

@Component({
    //moduleId: module.id,
    selector: "hs-app",
    templateUrl: "app.component.html"
})
export class AppComponent {
    isAuthenticated() {
        return this.authService.isAuthenticated();
    }

    get username() {
        return this.authService.userName;
    }
    constructor(private authService: AuthService) { }
}