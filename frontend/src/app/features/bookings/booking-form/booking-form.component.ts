import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { BookingService } from '../../../core/services/booking.service';
import { Event, TicketType } from '../../../shared/models/event.model';

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
})
export class BookingFormComponent implements OnInit {
  event: Event | null = null;
  bookingForm: FormGroup;
  loading: boolean = false;
  loadingEvent: boolean = true;
  error: string = '';
  showConfirmation: boolean = false;
  bookingCreated: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private bookingService: BookingService
  ) {
    this.bookingForm = this.fb.group({
      ticket_type_id: [null, Validators.required],
      number_of_tickets: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    });
  }

  ngOnInit(): void {
    const eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    this.eventService.getEvent(eventId).subscribe({
      next: (ev) => {
        this.event = ev;
        this.loadingEvent = false;
        if (ev.ticket_types && ev.ticket_types.length > 0) {
          this.bookingForm.get('ticket_type_id')?.setValue(ev.ticket_types[0].id);
        }
      },
      error: () => {
        this.error = 'Event not found';
        this.loadingEvent = false;
      },
    });
  }

  get selectedTicketType(): TicketType | undefined {
    const id = this.bookingForm.get('ticket_type_id')?.value;
    return this.event?.ticket_types?.find((t) => t.id == id);
  }

  get totalCost(): number {
    if (!this.selectedTicketType) return 0;
    return this.selectedTicketType.price * (this.bookingForm.get('number_of_tickets')?.value || 1);
  }

  openConfirmation(): void {
    if (this.bookingForm.invalid) return;
    this.showConfirmation = true;
  }

  confirmBooking(): void {
    if (!this.event) return;

    this.loading = true;
    this.error = '';

    this.bookingService.createBooking({
      event_id: this.event.id,
      ...this.bookingForm.value,
    }).subscribe({
      next: () => {
        this.bookingCreated = true;
        this.showConfirmation = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Booking failed';
        this.showConfirmation = false;
        this.loading = false;
      },
    });
  }
}
