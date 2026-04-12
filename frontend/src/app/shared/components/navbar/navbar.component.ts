import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
  standalone: true,
    imports: []
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadCount: number = 0;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUnreadCount();
        } else {
          this.unreadCount = 0;
        }
      })
    );

    // Poll unread count every 30 seconds when logged in
    this.subscriptions.add(
      interval(30000).pipe(
        startWith(0),
      ).subscribe(() => {
        if (this.currentUser) {
          this.loadUnreadCount();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (res) => (this.unreadCount = res.count),
      error: () => {},
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isOrganizer(): boolean {
    return this.currentUser?.role === 'organizer';
  }

  isParticipant(): boolean {
    return this.currentUser?.role === 'participant';
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
