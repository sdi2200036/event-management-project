import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User, UserStatus } from '../../../shared/models/user.model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';

@Component({
    selector: 'app-user-management',
    templateUrl: './user-management.component.html',
  standalone: true,
    imports: [ReactiveFormsModule, FormsModule, NgClass, DatePipe]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  error: string = '';
  filterStatus: string = '';
  filterRole: string = '';
  actionLoading: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    let url = `${environment.apiUrl}/users?`;
    if (this.filterStatus) url += `status=${this.filterStatus}&`;
    if (this.filterRole) url += `role=${this.filterRole}&`;

    this.http.get<User[]>(url).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loading = false;
      },
    });
  }

  approveUser(user: User): void {
    this.actionLoading = user.id;
    this.http.patch(`${environment.apiUrl}/users/${user.id}/approve`, {}).subscribe({
      next: () => {
        user.status = UserStatus.Approved;
        this.actionLoading = null;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to approve');
        this.actionLoading = null;
      },
    });
  }

  rejectUser(user: User): void {
    if (!confirm(`Reject user "${user.username}"?`)) return;
    this.actionLoading = user.id;
    this.http.patch(`${environment.apiUrl}/users/${user.id}/reject`, {}).subscribe({
      next: () => {
        user.status = UserStatus.Rejected;
        this.actionLoading = null;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to reject');
        this.actionLoading = null;
      },
    });
  }

  get pendingCount(): number {
    return this.users.filter((u) => u.status === UserStatus.Pending).length;
  }
}
