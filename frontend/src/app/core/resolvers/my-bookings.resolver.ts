import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Booking } from 'src/app/shared/models/booking.model';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

export const myBookingsResolver: ResolveFn<Booking[] | RedirectCommand> = () => {
	const bookingService = inject(BookingService);
	const router = inject(Router);
	const toastService = inject(ToastService);

	return bookingService.getMyBookings().pipe(
		catchError(() => {
			toastService.error('Failed to load your bookings');
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
