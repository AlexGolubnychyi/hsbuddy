import { Http, RequestOptions } from "@angular/http";
import {AuthHttp, AuthConfig} from "angular2-jwt/angular2-jwt";

export function authFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig({
    noJwtError: true
  }), http, options);
};

// Include this in your ngModule providers
export const authProvider = {
  provide: AuthHttp,
  deps: [Http, RequestOptions],
  useFactory: authFactory
};