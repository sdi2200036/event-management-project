import { Component, inject, signal } from '@angular/core';
import { FieldState, FormField, email, form, maxLength, minLength, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { RegisterUserRole } from 'src/app/shared/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	standalone: true,
	imports: [FormField]
})
export class RegisterComponent {
	private readonly toastService = inject(ToastService);

	readonly registerModel = signal({
		username: '',
		password: '',
		confirmPassword: '',
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		country: '',
		postal_code: '',
		afm: '',
		role: RegisterUserRole.Participant
	});
	readonly registerForm = form(this.registerModel, (p) => {
		required(p.username, { message: 'Username is required' });
		minLength(p.username, 3, {
			message: 'Username must be at least 3 characters'
		});
		maxLength(p.username, 50, {
			message: 'Username must be at most 50 characters'
		});

		required(p.password, { message: 'Password is required' });
		minLength(p.password, 6, {
			message: 'Password must be at least 6 characters'
		});

		required(p.confirmPassword);

		required(p.first_name, { message: 'First name is required' });
		required(p.last_name, { message: 'Last name is required' });
		required(p.email, { message: 'Email is required' });
		email(p.email, { message: 'Invalid email format' });

		minLength(p.afm, 9, { message: 'AFM must be 9 characters' });
		maxLength(p.afm, 9, { message: 'AFM must be 9 characters' });
		required(p.role, { message: 'Role is required' });
	});

	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	goToLogin(): void {
		this.router.navigate(['/login']);
	}

	async onSubmit(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.registerForm, async (form) => {
			if (this.registerModel().password !== this.registerModel().confirmPassword) {
				this.toastService.error('Passwords do not match.');
				return undefined;
			}

			return await firstValueFrom(
				this.authService.register(this.registerModel()).pipe(
					switchMap((res) => {
						this.registerForm().reset({
							username: '',
							password: '',
							confirmPassword: '',
							first_name: '',
							last_name: '',
							email: '',
							phone: '',
							address: '',
							city: '',
							country: '',
							postal_code: '',
							afm: '',
							role: RegisterUserRole.Participant
						});

						this.toastService.success(res.message);
						this.router.navigate(['/login']);
						return of(undefined);
					}),
					catchError((err) => {
						this.toastService.error(err.error?.message || 'Registration failed. Please try again.');
						return of(undefined);
					})
				)
			);
		});
	}

	protected isFieldInvalid(field: FieldState<any>): boolean {
		return field.touched() && !field.valid();
	}
}
