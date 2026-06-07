import { DatePipe } from '@angular/common';
import {
	Component,
	computed,
	input,
	linkedSignal,
	Signal,
	signal,
	TemplateRef,
	viewChild,
	WritableSignal
} from '@angular/core';
import { form, FormField, min, required, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { Event as EventModel, TicketType } from '../../../shared/models/event.model';

@Component({
	selector: 'app-booking-form',
	templateUrl: './booking-form.component.html',
	standalone: true,
	imports: [DatePipe, FormField]
})
export class BookingFormComponent {
	private confirmTemplate: Signal<TemplateRef<any>> = viewChild.required('confirmTemplate');

	public readonly event: Signal<EventModel | undefined> = input<EventModel>(undefined, { alias: 'eventData' });

	public readonly bookingModel: WritableSignal<{ ticket_type_id: string; number_of_tickets: number }> = linkedSignal(
		() => ({
			ticket_type_id: String(this.event()?.ticket_types?.[0]?.id),
			number_of_tickets: 1
		})
	);
	public readonly bookingForm = form(this.bookingModel, (p) => {
		required(p.ticket_type_id);
		required(p.number_of_tickets);
		min(p.number_of_tickets, 1, { message: 'Must book at least 1 ticket' });
		validate(p, ({ valueOf }) => {
			const count = valueOf(p.number_of_tickets);
			const ticketTypeId = valueOf(p.ticket_type_id);
			const ticketType = this.event()?.ticket_types?.find((t) => String(t.id) === ticketTypeId);
			if (ticketType && count > ticketType.available) {
				return [{ kind: 'form', message: `Only ${ticketType.available} ticket(s) available for this type` }];
			}
			return undefined;
		});
	});

	public bookingCreated: WritableSignal<boolean> = signal(false);

	public readonly selectedTicketType: Signal<TicketType | undefined> = computed(() => {
		const id: number = Number(this.bookingModel().ticket_type_id);
		return this.event()?.ticket_types?.find((t) => t.id == id);
	});

	public readonly totalCost: Signal<number> = computed(() => {
		const ticket = this.selectedTicketType();
		if (!ticket) return 0;
		return ticket.price * (this.bookingModel().number_of_tickets || 1);
	});

	constructor(
		private router: Router,
		private bookingService: BookingService,
		private toastService: ToastService,
		private modalService: ModalService
	) {}

	public async onSubmit(event: Event): Promise<void> {
		event.preventDefault();
		await submit(this.bookingForm, async () => {
			const btn = await this.modalService.open(this.confirmTemplate(), [
				{ label: 'Cancel', class: 'btn-outline-secondary' },
				{ label: 'Pay & Confirm', class: 'btn-primary' }
			]);
			if (btn === 'Pay & Confirm') this.confirmBooking();
		});
	}

	private confirmBooking(): void {
		const ev = this.event();
		if (!ev) return;

		this.bookingService
			.createBooking({
				event_id: ev.id,
				ticket_type_id: Number(this.bookingModel().ticket_type_id),
				number_of_tickets: Number(this.bookingModel().number_of_tickets)
			})
			.subscribe({
				next: () => {
					this.bookingCreated.set(true);
					this.toastService.success('Booking confirmed!');
				},
				error: (err) => {
					this.toastService.error(err.error?.message || 'Booking failed');
				}
			});
	}

	public goToBookings(): void {
		this.router.navigate(['/bookings']);
	}

	public goToEvents(): void {
		this.router.navigate(['/events']);
	}

	public messageOrganizer(): void {
		const username = this.event()?.organizer_username;
		if (!username) return;
		this.router.navigate(['/messages'], { queryParams: { receiver: username } });
	}
}
