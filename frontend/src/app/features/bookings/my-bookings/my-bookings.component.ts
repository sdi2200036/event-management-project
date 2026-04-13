import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../shared/models/booking.model';
import { Router } from '@angular/router';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';

@Component({
	selector: 'app-my-bookings',
	templateUrl: './my-bookings.component.html',
	standalone: true,
	imports: [NgClass, DecimalPipe, DatePipe]
})
export class MyBookingsComponent implements OnInit {
	bookings: Booking[] = [];
	error: string = '';
	cancellingId: number | null = null;

	constructor(
		private bookingService: BookingService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.loadBookings();
	}

	loadBookings(): void {
		this.bookingService.getMyBookings().subscribe({
			next: (bookings) => (this.bookings = bookings),
			error: () => (this.error = 'Failed to load bookings')
		});
	}

	cancelBooking(booking: Booking): void {
		if (!confirm(`Cancel booking for "${booking.event_title}"?`)) return;

		this.cancellingId = booking.id;
		this.bookingService.cancelBooking(booking.id).subscribe({
			next: () => {
				booking.booking_status = 'CANCELLED';
				this.cancellingId = null;
			},
			error: (err) => {
				alert(err.error?.message || 'Failed to cancel booking');
				this.cancellingId = null;
			}
		});
	}

	goToEvents(): void {
		this.router.navigate(['/events']);
	}

	goToEventDetail(eventId: number): void {
		this.router.navigate(['/events', eventId]);
	}
}
