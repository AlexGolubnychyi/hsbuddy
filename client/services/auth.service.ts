import { Injectable } from "@angular/core";

@Injectable()
export class AuthService {
    isAuthenticated() {
        return !!(<any>window)._authenticated;
   }
}