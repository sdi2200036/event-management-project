import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Event, EventFilters, EventsResponse, CreateEventRequest } from '../../shared/models/event.model';

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private apiUrl = `${environment.apiUrl}/events`;

	constructor(private http: HttpClient) {}

	getEvents(filters?: EventFilters): Observable<EventsResponse> {
		let params = new HttpParams();
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					params = params.set(key, String(value));
				}
			});
		}
		return this.http.get<EventsResponse>(this.apiUrl, { params });
	}

	getEvent(id: number): Observable<Event> {
		return this.http.get<Event>(`${this.apiUrl}/${id}`);
	}

	getMyEvents(): Observable<EventsResponse> {
		return this.http.get<EventsResponse>(`${this.apiUrl}/my`);
	}

	getRecommendations(topN: number = 10): Observable<{ events: Event[] }> {
		return this.http.get<{ events: Event[] }>(`${this.apiUrl}/recommendations`, {
			params: new HttpParams().set('topN', topN.toString())
		});
	}

	createEvent(data: CreateEventRequest): Observable<Event> {
		return this.http.post<Event>(this.apiUrl, data);
	}

	updateEvent(id: number, data: Partial<CreateEventRequest>): Observable<Event> {
		return this.http.put<Event>(`${this.apiUrl}/${id}`, data);
	}

	publishEvent(id: number): Observable<Event> {
		return this.http.patch<Event>(`${this.apiUrl}/${id}/publish`, {});
	}

	cancelEvent(id: number): Observable<Event> {
		return this.http.patch<Event>(`${this.apiUrl}/${id}/cancel`, {});
	}

	deleteEvent(id: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
	}
}
