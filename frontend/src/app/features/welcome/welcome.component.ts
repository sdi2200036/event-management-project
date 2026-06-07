import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
	selector: 'app-welcome',
	templateUrl: './welcome.component.html',
	standalone: true,
	imports: []
})
export class WelcomeComponent {
	constructor(
		private authService: AuthService,
		private router: Router
	) {
		// Redirect logged-in users to events page
		if (this.authService.isLoggedIn()) {
			this.router.navigate(['/events']);
		}
	}

	public goToLogin(): void {
		this.router.navigate(['/login']);
	}

	public goToRegister(): void {
		this.router.navigate(['/register']);
	}

	public goToEvents(): void {
		this.router.navigate(['/events']);
	}
}
