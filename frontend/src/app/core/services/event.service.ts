import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
	CreateEventRequest,
	EventFilters,
	Event as EventModel,
	EventsResponse,
	EventsResponseExtended
} from '../../shared/models/event.model';

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private apiUrl = `${environment.apiUrl}/events`;

	constructor(private http: HttpClient) {}

	getEvents(filters?: EventFilters): Observable<EventsResponseExtended> {
		let params = new HttpParams();
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					params = params.set(key, String(value));
				}
			});
		}
		return this.http.get<EventsResponseExtended>(this.apiUrl, { params });
	}

	getEvent(id: number): Observable<EventModel> {
		return this.http.get<EventModel>(`${this.apiUrl}/${id}`);
	}

	getMyEvents(): Observable<EventsResponseExtended> {
		return this.http.get<EventsResponseExtended>(`${this.apiUrl}/my`);
	}

	getRecommendations(topN: number = 10): Observable<EventsResponse> {
		return this.http.get<EventsResponse>(`${this.apiUrl}/recommendations`, {
			params: new HttpParams().set('topN', topN.toString())
		});
	}

	createEvent(data: CreateEventRequest): Observable<EventModel> {
		return this.http.post<EventModel>(this.apiUrl, data);
	}

	updateEvent(id: number, data: Partial<CreateEventRequest>): Observable<EventModel> {
		return this.http.put<EventModel>(`${this.apiUrl}/${id}`, data);
	}

	publishEvent(id: number): Observable<EventModel> {
		return this.http.patch<EventModel>(`${this.apiUrl}/${id}/publish`, {});
	}

	cancelEvent(id: number): Observable<EventModel> {
		return this.http.patch<EventModel>(`${this.apiUrl}/${id}/cancel`, {});
	}

	deleteEvent(id: number): Observable<{ message: string }> {
		return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
	}
}
