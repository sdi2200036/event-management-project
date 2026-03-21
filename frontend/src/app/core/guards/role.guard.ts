import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles: string[] = route.data['roles'] || [];
    const userRole = this.authService.getUserRole();

    if (requiredRoles.length === 0 || (userRole && requiredRoles.includes(userRole))) {
      return true;
    }

    this.router.navigate(['/events']);
    return false;
  }
}
