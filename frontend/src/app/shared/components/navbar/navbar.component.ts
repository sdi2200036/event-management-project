import { Component, OnInit, OnDestroy, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import { interval } from 'rxjs';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
  standalone: true,
    imports: []
})
export class NavbarComponent {
  unreadCount: WritableSignal<number> = signal(0);

  constructor(
    protected authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    if (this.authService.currentUser()) {
      this.loadUnreadCount();
    } else {
      this.unreadCount.set(0);
    }

    // Poll unread count every 30 seconds when logged in
    interval(30000).pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.authService.currentUser()) {
        this.loadUnreadCount();
      }
    });
  }

  loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe((res) => this.unreadCount.set(res.count));
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  isOrganizer(): boolean {
    return this.authService.currentUser()?.role === 'organizer';
  }

  isParticipant(): boolean {
    return this.authService.currentUser()?.role === 'participant';
  }

  isExactRoute(path: string): boolean {
    return this.router.url === path;
  }

  isRoutePrefix(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  goToManageEvents(): void {
    this.router.navigate(['/manage/events']);
  }

  goToCreateEvent(): void {
    this.router.navigate(['/manage/events/new']);
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  goToAdminUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  goToAdminExport(): void {
    this.router.navigate(['/admin/export']);
  }

  goToMessages(): void {
    this.router.navigate(['/messages']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
