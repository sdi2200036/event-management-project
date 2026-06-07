import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, CreateBookingRequest } from '../../shared/models/booking.model';

@Injectable({
	providedIn: 'root'
})
export class BookingService {
	private apiUrl = `${environment.apiUrl}/bookings`;

	constructor(private http: HttpClient) {}

	createBooking(data: CreateBookingRequest): Observable<Booking> {
		return this.http.post<Booking>(this.apiUrl, data);
	}

	getMyBookings(): Observable<Booking[]> {
		return this.http.get<Booking[]>(`${this.apiUrl}/my`);
	}

	getEventBookings(eventId: number): Observable<Booking[]> {
		return this.http.get<Booking[]>(`${this.apiUrl}/event/${eventId}`);
	}

	cancelBooking(bookingId: number): Observable<{ message: string }> {
		return this.http.patch<{ message: string }>(`${this.apiUrl}/${bookingId}/cancel`, {});
	}
}
