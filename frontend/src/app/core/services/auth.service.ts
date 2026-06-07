import { HttpClient } from '@angular/common/http';
import { computed, Injectable, Signal, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../../shared/models/user.model';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiUrl = environment.apiUrl;
	private _currentUser = signal<User | null>(this.loadUser());

	public currentUser: Signal<User | null> = this._currentUser.asReadonly();
	public userRole: Signal<UserRole> = computed(() => this._currentUser()?.role || UserRole.Undefined);
	public isLoggedIn: Signal<boolean> = computed(() => !!this._currentUser());

	constructor(private http: HttpClient) {}

	private loadUser(): User | null {
		try {
			const userData = localStorage.getItem('currentUser');
			return userData ? JSON.parse(userData) : null;
		} catch {
			return null;
		}
	}

	login(credentials: LoginRequest): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
			tap((response) => {
				localStorage.setItem('token', response.token);
				localStorage.setItem('currentUser', JSON.stringify(response.user));
				this._currentUser.set(response.user);
			})
		);
	}

	register(data: RegisterRequest): Observable<{ message: string }> {
		const { confirmPassword, ...payload } = data;
		return this.http.post<{ message: string }>(`${this.apiUrl}/auth/register`, payload);
	}

	logout(): void {
		localStorage.removeItem('token');
		localStorage.removeItem('currentUser');
		this._currentUser.set(null);
	}

	getToken(): string | null {
		return localStorage.getItem('token');
	}
}
