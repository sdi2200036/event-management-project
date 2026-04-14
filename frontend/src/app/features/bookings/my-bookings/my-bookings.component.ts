import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
	selector: 'app-my-bookings',
	templateUrl: './my-bookings.component.html',
	standalone: true,
	imports: [NgClass, DecimalPipe, DatePipe]
})
export class MyBookingsComponent {
	public readonly bookings: InputSignal<Booking[]> = input<Booking[]>([], { alias: 'bookingsData' });
	public cancellingId: WritableSignal<number | null> = signal(null);

	constructor(
		private bookingService: BookingService,
		private router: Router,
		private toastService: ToastService,
		private modalService: ModalService
	) {}

	public cancelBooking(booking: Booking): void {
		this.modalService.confirm(`Cancel booking for "${booking.event_title}"?`).then((confirmed) => {
			if (!confirmed) return;
			this.cancellingId.set(booking.id);
			this.bookingService.cancelBooking(booking.id).subscribe({
				next: () => {
					this.toastService.warning('Booking cancelled successfully');
					this.router.navigate([], { onSameUrlNavigation: 'reload' });
					this.cancellingId.set(null);
				},
				error: (err) => {
					this.toastService.error(err.error?.message || 'Failed to cancel booking');
					this.cancellingId.set(null);
				}
			});
		});
	}

	public goToEvents(): void {
		this.router.navigate(['events']);
	}

	public goToEventDetail(eventId: number): void {
		this.router.navigate(['events', 'public', eventId]);
	}
}
