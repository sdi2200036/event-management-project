import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { Booking } from 'src/app/shared/models/booking.model';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

export const myBookingsResolver: ResolveFn<Booking[]> = () => {
	const bookingService = inject(BookingService);
	const router = inject(Router);
	const toastService = inject(ToastService);

	return bookingService.getMyBookings().pipe(
		catchError(() => {
			toastService.error('Failed to load your bookings');
			return EMPTY;
		})
	);
};
