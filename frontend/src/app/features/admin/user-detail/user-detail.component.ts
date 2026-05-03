import { DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../shared/models/user.model';

@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.component.html',
	standalone: true,
	imports: [NgClass, DatePipe]
})
export class UserDetailComponent {
	public readonly userData: InputSignal<User | undefined> = input<User>();
	public readonly loading: WritableSignal<boolean> = signal(false);

	constructor(
		private http: HttpClient,
		private router: Router,
		private toastService: ToastService,
		private modalService: ModalService
	) {}

	public goBack(): void {
		this.router.navigate(['/admin/users']);
	}

	public approveUser(): void {
		const user = this.userData();
		if (!user) return;
		this.loading.set(true);
		this.http.patch(`${environment.apiUrl}/users/${user.id}/approve`, {}).subscribe({
			next: () => {
				this.toastService.success(`User "${user.username}" approved`);
				this.router.navigate(['/admin/users', user.id]);
			},
			error: (err) => {
				this.toastService.error(err.error?.message || 'Failed to approve');
				this.loading.set(false);
			}
		});
	}

	public rejectUser(): void {
		const user = this.userData();
		if (!user) return;
		this.modalService.confirm(`Reject user "${user.username}"?`).then((confirmed) => {
			if (!confirmed) return;
			this.loading.set(true);
			this.http.patch(`${environment.apiUrl}/users/${user.id}/reject`, {}).subscribe({
				next: () => {
					this.toastService.success(`User "${user.username}" rejected`);
					this.router.navigate(['/admin/users', user.id]);
				},
				error: (err) => {
					this.toastService.error(err.error?.message || 'Failed to reject');
					this.loading.set(false);
				}
			});
		});
	}

	public suspendUser(): void {
		const user = this.userData();
		if (!user) return;
		this.modalService.confirm(`Suspend user "${user.username}"? They will lose access immediately.`).then((confirmed) => {
			if (!confirmed) return;
			this.loading.set(true);
			this.http.patch(`${environment.apiUrl}/users/${user.id}/suspend`, {}).subscribe({
				next: () => {
					this.toastService.success(`User "${user.username}" suspended`);
					this.router.navigate(['/admin/users', user.id]);
				},
				error: (err) => {
					this.toastService.error(err.error?.message || 'Failed to suspend');
					this.loading.set(false);
				}
			});
		});
	}
}
