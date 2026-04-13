import { DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { User, UserStatus } from '../../../shared/models/user.model';

@Component({
	selector: 'app-user-management',
	templateUrl: './user-management.component.html',
	standalone: true,
	imports: [ReactiveFormsModule, FormsModule, NgClass, DatePipe]
})
export class UserManagementComponent {
	users: InputSignal<User[]> = input<User[]>([], { alias: 'usersData' });
	error: WritableSignal<string> = signal('');
	filterStatus: WritableSignal<string> = signal('');
	filterRole: WritableSignal<string> = signal('');
	actionLoading: WritableSignal<number | null> = signal(null);

	pendingCount: Signal<number> = computed(() => this.users().filter((u) => u.status === UserStatus.Pending).length);

	constructor(
		private http: HttpClient,
		private router: Router
	) {}

	loadUsers(): void {
		this.router.navigate([], {
			queryParams: {
				status: this.filterStatus() || null,
				role: this.filterRole() || null
			},
			queryParamsHandling: 'merge',
			onSameUrlNavigation: 'reload'
		});
	}

	approveUser(user: User): void {
		this.actionLoading.set(user.id);
		this.http.patch(`${environment.apiUrl}/users/${user.id}/approve`, {}).subscribe({
			next: () => {
				this.router.navigate([], { onSameUrlNavigation: 'reload' });
				this.actionLoading.set(null);
			},
			error: (err) => {
				alert(err.error?.message || 'Failed to approve');
				this.actionLoading.set(null);
			}
		});
	}

	rejectUser(user: User): void {
		if (!confirm(`Reject user "${user.username}"?`)) return;
		this.actionLoading.set(user.id);
		this.http.patch(`${environment.apiUrl}/users/${user.id}/reject`, {}).subscribe({
			next: () => {
				this.router.navigate([], { onSameUrlNavigation: 'reload' });
				this.actionLoading.set(null);
			},
			error: (err) => {
				alert(err.error?.message || 'Failed to reject');
				this.actionLoading.set(null);
			}
		});
	}
}
