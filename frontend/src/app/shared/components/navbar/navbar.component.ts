import { Component, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	standalone: true,
	imports: []
})
export class NavbarComponent {
	public readonly unreadCount: Signal<number> = this.messageService.unreadCount;

	constructor(
		protected authService: AuthService,
		private messageService: MessageService,
		private router: Router
	) {
		if (this.authService.currentUser()) {
			this.messageService.refreshUnreadCount();
		}

		// Poll unread count every 30 seconds when logged in
		interval(30000)
			.pipe(takeUntilDestroyed())
			.subscribe(() => {
				if (this.authService.currentUser()) {
					this.messageService.refreshUnreadCount();
				}
			});
	}

	public isLoggedIn(): boolean {
		return this.authService.isLoggedIn();
	}

	public isAdmin(): boolean {
		return this.authService.currentUser()?.role === 'admin';
	}

	public isOrganizer(): boolean {
		return this.authService.currentUser()?.role === 'organizer';
	}

	public isParticipant(): boolean {
		return this.authService.currentUser()?.role === 'participant';
	}

	public isExactRoute(path: string): boolean {
		return this.router.url === path;
	}

	public isRoutePrefix(path: string): boolean {
		return this.router.url.startsWith(path);
	}

	public goToHome(): void {
		this.router.navigate(['/']);
	}

	public goToEvents(): void {
		this.router.navigate(['events']);
	}

	public goToManageEvents(): void {
		this.router.navigate(['events', 'manage']);
	}

	public goToCreateEvent(): void {
		this.router.navigate(['events', 'manage', 'new']);
	}

	public goToBookings(): void {
		this.router.navigate(['bookings']);
	}

	public goToAdminUsers(): void {
		this.router.navigate(['admin', 'users']);
	}

	public goToAdminExport(): void {
		this.router.navigate(['admin', 'export']);
	}

	public goToMessages(): void {
		this.router.navigate(['messages']);
	}

	public goToLogin(): void {
		this.router.navigate(['login']);
	}

	public goToRegister(): void {
		this.router.navigate(['register']);
	}

	public logout(): void {
		this.authService.logout();
		this.router.navigate(['/']);
	}
}
