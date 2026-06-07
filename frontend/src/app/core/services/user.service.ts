import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRole, UserStatus } from 'src/app/shared/models/user.model';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private http: HttpClient = inject(HttpClient);
	private endpointBaseUrl = 'users';

	public getUsers(filterStatus: UserStatus | null, filterRole: UserRole | null): Observable<User[]> {
		const url = `${environment.apiUrl}/${this.endpointBaseUrl}?`;
		let params = new HttpParams();
		if (filterStatus) params = params.set('status', filterStatus);
		if (filterRole) params = params.set('role', filterRole);

		return this.http.get<User[]>(url, { params: params });
	}

	public getUserById(id: number): Observable<User> {
		return this.http.get<User>(`${environment.apiUrl}/${this.endpointBaseUrl}/${id}`);
	}
}
