
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router /*,private permissions: Permissions, private currentUser: UserToken*/) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // return this.permissions.canActivate(this.currentUser, this.route.params.id);

    // disable login when already logged in
    if (state.url === '/login') {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['']);
        return false;
      }
      return true;
    }

    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.authService.redirectUrl = state.url;
    this.router.navigate(['/login']);

    return false;
  }
}
