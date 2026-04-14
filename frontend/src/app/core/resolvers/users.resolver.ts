import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { User, UserRole, UserStatus } from 'src/app/shared/models/user.model';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';

export const usersResolver: ResolveFn<User[]> = (route) => {
	const userService: UserService = inject(UserService);
	const router: Router = inject(Router);
	const toastService: ToastService = inject(ToastService);
	const filterStatus: UserStatus | null = route.queryParamMap.get('status') as UserStatus | null;
	const filterRole: UserRole | null = route.queryParamMap.get('role') as UserRole | null;

	return userService.getUsers(filterStatus, filterRole).pipe(
		catchError(() => {
			toastService.error('Failed to load users');
			return of(new RedirectCommand(router.parseUrl('/')));
		})
	);
};
