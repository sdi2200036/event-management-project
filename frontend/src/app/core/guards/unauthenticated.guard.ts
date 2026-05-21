import { inject } from '@angular/core/primitives/di';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const unauthenticatedGuard: CanActivateFn = () => {
	const authService: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	return authService.isLoggedIn() ? new RedirectCommand(router.parseUrl('/events')) : true;
};
