import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormField, form, max, min, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { EventService } from '../../../core/services/event.service';
import { Event as EventModel, TicketType } from '../../../shared/models/event.model';

@Component({
	selector: 'app-booking-form',
	templateUrl: './booking-form.component.html',
	standalone: true,
	imports: [DatePipe, FormField]
})
export class BookingFormComponent implements OnInit {
	event: EventModel | null = null;
	readonly bookingModel = signal({
		ticket_type_id: '',
		number_of_tickets: 1
	});
	readonly bookingForm = form(this.bookingModel, (p) => {
		required(p.ticket_type_id);
		required(p.number_of_tickets);
		min(p.number_of_tickets, 1);
		max(p.number_of_tickets, 20);
	});
	error: string = '';
	showConfirmation: boolean = false;
	bookingCreated: boolean = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private eventService: EventService,
		private bookingService: BookingService
	) {}

	ngOnInit(): void {
		const eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
		this.eventService.getEvent(eventId).subscribe({
			next: (ev) => {
				this.event = ev;
				if (ev.ticket_types && ev.ticket_types.length > 0) {
					this.bookingModel.update((current) => ({
						...current,
						ticket_type_id: String(ev.ticket_types![0].id)
					}));
				}
			},
			error: () => (this.error = 'Event not found')
		});
	}

	get selectedTicketType(): TicketType | undefined {
		const id = Number(this.bookingModel().ticket_type_id);
		return this.event?.ticket_types?.find((t) => t.id == id);
	}

	get totalCost(): number {
		if (!this.selectedTicketType) return 0;
		return this.selectedTicketType.price * (this.bookingModel().number_of_tickets || 1);
	}

	async openConfirmation(): Promise<void> {
		const isValid = await submit(this.bookingForm);
		if (!isValid) return;
		this.showConfirmation = true;
	}

	confirmBooking(): void {
		if (!this.event) return;

		this.error = '';
		this.bookingService
			.createBooking({
				event_id: this.event.id,
				ticket_type_id: Number(this.bookingModel().ticket_type_id),
				number_of_tickets: Number(this.bookingModel().number_of_tickets)
			})
			.subscribe({
				next: () => {
					this.bookingCreated = true;
					this.showConfirmation = false;
				},
				error: (err) => {
					this.error = err.error?.message || 'Booking failed';
					this.showConfirmation = false;
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
