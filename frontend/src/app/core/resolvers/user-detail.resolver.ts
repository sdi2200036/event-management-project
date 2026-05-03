import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';

export const userDetailResolver: ResolveFn<User> = (route) => {
	const userService: UserService = inject(UserService);
	const router: Router = inject(Router);
	const toastService: ToastService = inject(ToastService);
	const id = parseInt(route.paramMap.get('id')!, 10);

	return userService.getUserById(id).pipe(
		catchError(() => {
			toastService.error('User not found');
			return of(new RedirectCommand(router.parseUrl('/admin/users')));
		})
	);
};
