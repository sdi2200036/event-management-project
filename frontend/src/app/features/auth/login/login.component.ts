import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	standalone: true,
	imports: [FormField]
})
export class LoginComponent {
	readonly loginModel = signal({
		username: '',
		password: ''
	});
	readonly loginFields = form(this.loginModel, (p) => {
		required(p.username);
		required(p.password);
	});
	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	goToRegister(): void {
		this.router.navigate(['/register']);
	}

	async onSubmit(event: Event): Promise<void> {
		event.preventDefault();

		await submit(this.loginFields, async (form) => {
			return await firstValueFrom(
				this.authService.login(form().value()).pipe(
					switchMap(() => {
						this.router.navigate(['/events']);
						return of(undefined);
					}),
					catchError((err) => {
						return of([
							{
								kind: 'credentials',
								field: 'form',
								message: err.error?.message || 'Invalid username or password. Please try again.'
							}
						]);
					})
				)
			);
		});
	}
}
