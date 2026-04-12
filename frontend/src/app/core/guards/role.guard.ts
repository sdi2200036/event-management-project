import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree, RedirectCommand } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): RedirectCommand | boolean {
    if (!this.authService.isLoggedIn()) {
      return new RedirectCommand(this.router.parseUrl('/login'), { skipLocationChange: true });
    }

    const requiredRoles: string[] = route.data['roles'] || [];
    const userRole = this.authService.userRole();

    if (requiredRoles.length !== 0 && (!userRole || !requiredRoles.includes(userRole))) {
      return new RedirectCommand(this.router.parseUrl('/events'), { skipLocationChange: true });
    }

    return true;
  }
}
