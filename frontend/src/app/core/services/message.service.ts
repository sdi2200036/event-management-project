import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
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

export interface PaginatedInboxResponse {
	messages: Message[];
	total: number;
	unread_count: number;
}

export interface PaginatedSentResponse {
	messages: Message[];
	total: number;
}

const PAGE_SIZE = 10;

@Injectable({
	providedIn: 'root'
})
export class MessageService {
	private apiUrl = `${environment.apiUrl}/messages`;

	private readonly _unreadCount: WritableSignal<number> = signal(0);
	public readonly unreadCount: Signal<number> = this._unreadCount.asReadonly();

	constructor(private http: HttpClient) {}

	public refreshUnreadCount(): void {
		this.http
			.get<{ count: number }>(`${this.apiUrl}/unread-count`, {
				context: new HttpContext().set(SKIP_LOADING, true)
			})
			.subscribe((res) => this._unreadCount.set(res.count));
	}

	public getInbox(page = 1): Observable<PaginatedInboxResponse> {
		const params = new HttpParams().set('page', page.toString());
		return this.http
			.get<PaginatedInboxResponse>(`${this.apiUrl}/inbox`, { params })
			.pipe(tap((res) => this._unreadCount.set(res.unread_count)));
	}

	public getSent(page = 1): Observable<PaginatedSentResponse> {
		const params = new HttpParams().set('page', page.toString());
		return this.http.get<PaginatedSentResponse>(`${this.apiUrl}/sent`, { params });
	}

	public sendMessage(data: SendMessageRequest): Observable<Message> {
		return this.http.post<Message>(this.apiUrl, data);
	}

	public deleteMessage(id: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
	}

	public markAsRead(id: number): Observable<{ message: string }> {
		return this.http
			.patch<{ message: string }>(`${this.apiUrl}/${id}/read`, {})
			.pipe(tap(() => this.refreshUnreadCount()));
	}
}

export { PAGE_SIZE };
