import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RedirectCommand, Router } from '@angular/router';
import { UserRole } from 'src/app/shared/models/user.model';
import { AuthService } from '../services/auth.service';

@Injectable({
	providedIn: 'root'
})
export class RoleGuard implements CanActivate {
	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	public canActivate(route: ActivatedRouteSnapshot): RedirectCommand | boolean {
		if (!this.authService.isLoggedIn()) {
			return new RedirectCommand(this.router.parseUrl('/login'), { skipLocationChange: true });
		}

		const requiredRoles: string[] = route.data['roles'] || [];
		const userRole: UserRole | null = this.authService.userRole();

		if (requiredRoles.length !== 0 && (!userRole || !requiredRoles.includes(userRole))) {
			return new RedirectCommand(this.router.parseUrl('/events'), { skipLocationChange: true });
		}

		return true;
	}
}
