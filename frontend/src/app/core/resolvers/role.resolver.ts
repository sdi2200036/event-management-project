import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { UserRole } from 'src/app/shared/models/user.model';
import { AuthService } from '../services/auth.service';

export const roleResolver: ResolveFn<UserRole> = () => {
	const authService = inject(AuthService);

	if (authService.isLoggedIn()) {
		return of(authService.currentUser()!.role);
	}

	return of(UserRole.Undefined);
};
