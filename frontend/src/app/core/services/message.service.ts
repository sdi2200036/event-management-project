import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING } from '../interceptors/loading.interceptor';

export interface Message {
	id: number;
	sender_id: number;
	receiver_id: number;
	booking_id?: number;
	subject: string;
	body: string;
	is_read: boolean;
	sent_at: string;
	sender_username?: string;
	sender_first_name?: string;
	sender_last_name?: string;
	receiver_username?: string;
	receiver_first_name?: string;
	receiver_last_name?: string;
}

export interface SendMessageRequest {
	receiver_username: string;
	booking_id?: number;
	subject: string;
	body: string;
}

@Injectable({
	providedIn: 'root'
})
export class MessageService {
	private apiUrl = `${environment.apiUrl}/messages`;

	private readonly _unreadCount: WritableSignal<number> = signal(0);
	public readonly unreadCount: Signal<number> = this._unreadCount.asReadonly();

	constructor(private http: HttpClient) {}

	refreshUnreadCount(): void {
		this.http
			.get<{ count: number }>(`${this.apiUrl}/unread-count`, {
				context: new HttpContext().set(SKIP_LOADING, true)
			})
			.subscribe((res) => this._unreadCount.set(res.count));
	}

	getInbox(): Observable<Message[]> {
		return this.http.get<Message[]>(`${this.apiUrl}/inbox`).pipe(
			tap((messages) => {
				const unreadCount = messages.filter((m) => !m.is_read).length;
				this._unreadCount.set(unreadCount);
			})
		);
	}

	getSent(): Observable<Message[]> {
		return this.http.get<Message[]>(`${this.apiUrl}/sent`);
	}

	sendMessage(data: SendMessageRequest): Observable<Message> {
		return this.http.post<Message>(this.apiUrl, data);
	}

	deleteMessage(id: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
	}

	markAsRead(id: number): Observable<{ message: string }> {
		return this.http
			.patch<{ message: string }>(`${this.apiUrl}/${id}/read`, {})
			.pipe(tap(() => this.refreshUnreadCount()));
	}
}
