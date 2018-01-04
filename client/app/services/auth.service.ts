import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import '../rxjs-operators';
import { Router } from '@angular/router';
import * as contracts from '../../../interfaces/index';
import { Subject } from 'rxjs/Subject';
import {JwtHelperService} from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';

export const defaultTokenName = 'jwt_token_name';

export function tokenGetter() {
    return localStorage.getItem(defaultTokenName);
}

@Injectable()
export class AuthService {
    redirectUrl: string;
    private _userName: string;
    public authChanged: Subject<AuthChanged>;

    constructor(private router: Router, private http: HttpClient, private jwtHelper: JwtHelperService) {
        this.authChanged = new Subject<AuthChanged>();
    }

    isAuthenticated() {
        return this.jwtHelper.tokenGetter() && !this.jwtHelper.isTokenExpired();
    }

    get userName() {
        if (!this._userName) {
            this._userName = this.getUserName();
        }
        return this._userName;
    }

    login(data: { username: string, password: string }) {
        return this.http.post<contracts.AuthResult>('api/login', data)
            .map(result => {
                if (result.success) {
                    this.addToken(result.token);
                    this.authChanged.next({
                        auth: true,
                        username: this.userName
                    });
                    this.router.navigateByUrl(this.redirectUrl || '');
                }
                return result;
            })
            .catch(this.onFail);
    }

    register(data: { username: string, password: string }) {
        return this.http.post<contracts.AuthResult>('api/register', data)
            .map(result => {
                if (result.success) {
                    this.addToken(result.token);
                    this.authChanged.next({
                        auth: true,
                        username: this.userName
                    });
                    this.router.navigateByUrl(this.redirectUrl || '');
                }
                return result;
            })
            .catch(this.onFail);
    }

    logout() {
        this._userName = null;
        this.deleteToken();
        this.router.navigateByUrl('/login');
    }

    private onFail() {
        return Observable.of(<contracts.AuthResult>{ success: false, error: 'unknown server error, please try again soon' });
    }

    private addToken(token: any, tokenName = defaultTokenName) {
        return localStorage.setItem(tokenName, token);
    }
    private deleteToken(tokenName = defaultTokenName) {
        return localStorage.removeItem(tokenName);
    }

    private getUserName() {
        const token = this.jwtHelper.tokenGetter();
        if (!token) {
            return null;
        }
        const payload = this.jwtHelper.decodeToken(token) as contracts.TokenPayload;
        return payload.username;
    }
}

interface AuthChanged {
    auth: boolean;
    username: string;
}
