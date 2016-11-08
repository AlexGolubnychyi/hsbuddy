import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "../rxjs-operators";
import { Router } from "@angular/router";
import * as contracts from "../../interfaces/index";
import { Subject } from "rxjs/Subject";
import { JwtHelper, AuthConfigConsts } from "angular2-jwt/angular2-jwt";

@Injectable()
export class AuthService {
    redirectUrl: string;
    private jwtHelper = new JwtHelper();
    private _userName: string;
    public authChanged: Subject<AuthChanged>;

    constructor(private router: Router, private http: Http) {
        this.authChanged = new Subject<AuthChanged>();
    }

    isAuthenticated() {
        return this.tokenNotExpired();
    }

    get userName() {
        if (!this._userName) {
            this._userName = this.getUserName();
        }
        return this._userName;
    }

    login(data: { username: string, password: string }) {
        return this.http.post("login", data)
            .map(resp => resp.json() as contracts.AuthResult)
            .map(result => {
                if (result.success) {
                    this.addToken(result.token);
                    this.authChanged.next({
                        auth: true,
                        username: this.userName
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
                    this.addToken(result.token);
                    this.authChanged.next({
                        auth: true,
                        username: this.userName
                    });
                    this.router.navigateByUrl(this.redirectUrl || "");
                }
                return result;
            })
            .catch(this.onFail);
    }

    logout() {
        this._userName = null;
        this.deleteToken();
        this.router.navigateByUrl("/login");
    }

    private onFail() {
        return Observable.of(<contracts.AuthResult>{ success: false, error: "unknown server error, please try again soon" });
    }
    private getToken(tokenName = AuthConfigConsts.DEFAULT_TOKEN_NAME) {
        return localStorage.getItem(tokenName);
    }
    private addToken(token: any, tokenName = AuthConfigConsts.DEFAULT_TOKEN_NAME) {
        return localStorage.setItem(tokenName, token);
    }
    private deleteToken(tokenName = AuthConfigConsts.DEFAULT_TOKEN_NAME) {
        return localStorage.removeItem(tokenName);
    }
    private tokenNotExpired() {
        let token = this.getToken();
        return token && !this.jwtHelper.isTokenExpired(token);
    }
    private getUserName() {
        let token = this.getToken();
        if (!token) {
            return null;
        }
        let payload = this.jwtHelper.decodeToken(token) as contracts.TokenPayload;
        return payload.username;
    }
}

interface AuthChanged {
    auth: boolean;
    username: string;
}