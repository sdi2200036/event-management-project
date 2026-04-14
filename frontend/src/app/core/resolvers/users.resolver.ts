import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { User, UserRole, UserStatus } from 'src/app/shared/models/user.model';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';

export const usersResolver: ResolveFn<User[]> = (route) => {
	const userService = inject(UserService);
	const router = inject(Router);
	const toastService = inject(ToastService);
	const filterStatus = route.queryParamMap.get('status') as UserStatus | null;
	const filterRole = route.queryParamMap.get('role') as UserRole | null;

	return userService.getUsers(filterStatus, filterRole).pipe(
		catchError(() => {
			toastService.error('Failed to load users');
			return of(new RedirectCommand(router.parseUrl('/')));
		})
	);
};
