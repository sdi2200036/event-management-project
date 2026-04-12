import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
	receiver_id: number;
	booking_id?: number;
	subject: string;
	body: string;
}

@Injectable({
	providedIn: 'root'
})
export class MessageService {
	private apiUrl = `${environment.apiUrl}/messages`;

	constructor(private http: HttpClient) {}

	getInbox(): Observable<Message[]> {
		return this.http.get<Message[]>(`${this.apiUrl}/inbox`);
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
		return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/read`, {});
	}

	getUnreadCount(): Observable<{ count: number }> {
		return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
	}
}
