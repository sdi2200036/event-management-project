import { DatePipe } from '@angular/common';
import { Component, computed, input, linkedSignal, Signal, signal, WritableSignal } from '@angular/core';
import { form, FormField, max, min, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Event as EventModel, TicketType } from '../../../shared/models/event.model';

@Component({
	selector: 'app-booking-form',
	templateUrl: './booking-form.component.html',
	standalone: true,
	imports: [DatePipe, FormField]
})
export class BookingFormComponent {
	readonly event: Signal<EventModel | undefined> = input<EventModel>(undefined, { alias: 'eventData' });

	readonly bookingModel = linkedSignal(() => ({
		ticket_type_id: String(this.event()?.ticket_types?.[0]?.id),
		number_of_tickets: 1
	}));
	readonly bookingForm = form(this.bookingModel, (p) => {
		required(p.ticket_type_id);
		required(p.number_of_tickets);
		min(p.number_of_tickets, 1);
		max(p.number_of_tickets, 20);
	});

	error: WritableSignal<string> = signal('');
	showConfirmation: WritableSignal<boolean> = signal(false);
	bookingCreated: WritableSignal<boolean> = signal(false);

	readonly selectedTicketType: Signal<TicketType | undefined> = computed(() => {
		const id = Number(this.bookingModel().ticket_type_id);
		return this.event()?.ticket_types?.find((t) => t.id == id);
	});

	readonly totalCost: Signal<number> = computed(() => {
		const ticket = this.selectedTicketType();
		if (!ticket) return 0;
		return ticket.price * (this.bookingModel().number_of_tickets || 1);
	});

	constructor(
		private router: Router,
		private bookingService: BookingService
	) {}

	async onSubmit(event: Event): Promise<void> {
		event.preventDefault();
		await submit(this.bookingForm, async () => {
			this.showConfirmation.set(true);
		});
	}

	confirmBooking(): void {
		const ev = this.event();
		if (!ev) return;

		this.error.set('');
		this.bookingService
			.createBooking({
				event_id: ev.id,
				ticket_type_id: Number(this.bookingModel().ticket_type_id),
				number_of_tickets: Number(this.bookingModel().number_of_tickets)
			})
			.subscribe({
				next: () => {
					this.bookingCreated.set(true);
					this.showConfirmation.set(false);
				},
				error: (err) => {
					this.error.set(err.error?.message || 'Booking failed');
					this.showConfirmation.set(false);
				}
			});
	}

	goToBookings(): void {
		this.router.navigate(['/bookings']);
	}

	goToEvents(): void {
		this.router.navigate(['/events']);
	}
}
