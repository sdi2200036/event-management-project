import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Booking } from 'src/app/shared/models/booking.model';
import { BookingService } from '../services/booking.service';

export const myBookingsResolver: ResolveFn<Booking[] | RedirectCommand> = () => {
	const bookingService = inject(BookingService);
	const router = inject(Router);

	return bookingService.getMyBookings().pipe(
		catchError(() => {
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
