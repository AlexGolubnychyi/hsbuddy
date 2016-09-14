import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "../rxjs-operators";
import { Router } from "@angular/router";
import * as contracts from "../../interfaces/index";
import { Subject } from "rxjs/Subject";

@Injectable()
export class AuthService {
    redirectUrl: string;
    private _userName: string;
    public authChanged: Subject<AuthChanged>;

    constructor(private router: Router, private http: Http) {
        this.authChanged = new Subject<AuthChanged>();
    }

    isAuthenticated() {
        return !!this.userName;
    }

    get userName() {
        return this._userName || (<any>window)._authenticated;
    }

    login(data: { username: string, password: string }) {
        return this.http.post("login", data)
            .map(resp => resp.json() as contracts.AuthResult)
            .map(result => {
                if (result.success) {
                    this._userName = data.username.toLowerCase();
                    this.authChanged.next({
                        auth: true,
                        username: this._userName
                    });
                    this.router.navigateByUrl(this.redirectUrl || "");
                }
                return result;
            })
            .catch(this.onFail);
    }

    register(data: { username: string, password: string }) {
        return this.http.post("register", data)
            .map(resp => resp.json() as contracts.AuthResult)
            .map(result => {
                if (result.success) {
                    this._userName = data.username.toLowerCase();
                    this.authChanged.next({
                        auth: true,
                        username: this._userName
                    });
                    this.router.navigateByUrl(this.redirectUrl || "");
                }
                return result;
            })
            .catch(this.onFail);
    }

    private onFail() {
        return Observable.of(<contracts.AuthResult>{ success: false, error: "unknown server error, please try again soon" });
    }
}

interface AuthChanged {
    auth: boolean;
    username: string;
}