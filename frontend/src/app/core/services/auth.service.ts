import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

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
        this.currentUserSubject.next(response.user);
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
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
