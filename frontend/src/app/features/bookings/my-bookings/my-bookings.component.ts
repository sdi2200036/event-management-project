import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading: boolean = true;
  error: string = '';
  cancellingId: number | null = null;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load bookings';
        this.loading = false;
      },
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
      },
    });
  }
}
