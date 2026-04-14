import { DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserStatus } from '../../../shared/models/user.model';

@Component({
	selector: 'app-user-management',
	templateUrl: './user-management.component.html',
	standalone: true,
	imports: [ReactiveFormsModule, FormsModule, NgClass, DatePipe]
})
export class UserManagementComponent {
	public users: InputSignal<User[]> = input<User[]>([], { alias: 'usersData' });
	public filterStatus: WritableSignal<string> = signal('');
	public filterRole: WritableSignal<string> = signal('');
	public actionLoading: WritableSignal<number | null> = signal(null);

	public pendingCount: Signal<number> = computed(() => this.users().filter((u) => u.status === UserStatus.Pending).length);

	constructor(
		private http: HttpClient,
		private router: Router,
		private toastService: ToastService
	) {}

	public loadUsers(): void {
		this.router.navigate([], {
			queryParams: {
				status: this.filterStatus() || null,
				role: this.filterRole() || null
			},
			queryParamsHandling: 'merge',
			onSameUrlNavigation: 'reload'
		});
	}

	public approveUser(user: User): void {
		this.actionLoading.set(user.id);
		this.http.patch(`${environment.apiUrl}/users/${user.id}/approve`, {}).subscribe({
			next: () => {
				this.toastService.success(`User "${user.username}" approved`);
				this.router.navigate([], { onSameUrlNavigation: 'reload' });
				this.actionLoading.set(null);
			},
			error: (err) => {
				this.toastService.error(err.error?.message || 'Failed to approve');
				this.actionLoading.set(null);
			}
		});
	}

	public rejectUser(user: User): void {
		if (!confirm(`Reject user "${user.username}"?`)) return;
		this.actionLoading.set(user.id);
		this.http.patch(`${environment.apiUrl}/users/${user.id}/reject`, {}).subscribe({
			next: () => {
				this.toastService.success(`User "${user.username}" rejected`);
				this.router.navigate([], { onSameUrlNavigation: 'reload' });
				this.actionLoading.set(null);
			},
			error: (err) => {
				this.toastService.error(err.error?.message || 'Failed to reject');
				this.actionLoading.set(null);
			}
		});
	}
}
