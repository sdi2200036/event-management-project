import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
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
			return EMPTY;
		})
	);
};
