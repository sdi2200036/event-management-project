import { Component, signal, WritableSignal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoginRequest } from 'src/app/shared/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	standalone: true,
	imports: [FormField]
})
export class LoginComponent {
	public readonly loginModel: WritableSignal<LoginRequest> = signal({
		username: '',
		password: ''
	});
	public readonly loginFields = form(this.loginModel, (p) => {
		required(p.username);
		required(p.password);
	});

	constructor(
		private authService: AuthService,
		private router: Router,
		private toastService: ToastService
	) {}

	public goToRegister(): void {
		this.router.navigate(['/register']);
	}

	public async onSubmit(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.loginFields, async (form) => {
			return await firstValueFrom(
				this.authService.login(form().value()).pipe(
					switchMap((response) => {
						const destination = response.user.role === 'admin' ? '/admin/users' : '/events';
						this.router.navigate([destination]);
						return of(undefined);
					}),
					catchError((err) => {
						this.toastService.error(
							err.error?.message || 'Invalid username or password. Please try again.'
						);
						return of(undefined);
					})
				)
			);
		});
	}
}
