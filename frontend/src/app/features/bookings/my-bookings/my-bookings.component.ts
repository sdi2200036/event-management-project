import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
	selector: 'app-my-bookings',
	templateUrl: './my-bookings.component.html',
	standalone: true,
	imports: [NgClass, DecimalPipe, DatePipe]
})
export class MyBookingsComponent {
	readonly bookings: InputSignal<Booking[]> = input<Booking[]>([], { alias: 'bookingsData' });
	error: WritableSignal<string> = signal('');
	cancellingId: WritableSignal<number | null> = signal(null);

	constructor(
		private bookingService: BookingService,
		private router: Router
	) {}

	cancelBooking(booking: Booking): void {
		if (!confirm(`Cancel booking for "${booking.event_title}"?`)) return;

		this.cancellingId.set(booking.id);
		this.bookingService.cancelBooking(booking.id).subscribe({
			next: () => {
				this.router.navigate([], { onSameUrlNavigation: 'reload' });
				this.cancellingId.set(null);
			},
			error: (err) => {
				alert(err.error?.message || 'Failed to cancel booking');
				this.cancellingId.set(null);
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
