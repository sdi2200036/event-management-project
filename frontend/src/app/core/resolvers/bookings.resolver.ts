import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Booking } from 'src/app/shared/models/booking.model';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

export const bookingsResolver: ResolveFn<Booking[]> = (route, state) => {
	const id: string | null = route.paramMap.get('id');

	const bookingService: BookingService = inject(BookingService);
	const toastService: ToastService = inject(ToastService);
	const eventId: number = Number(id);
	const router = inject(Router);

	if (isNaN(eventId)) {
		return of([]);
	}

	return bookingService.getEventBookings(eventId).pipe(
		catchError((err) => {
			toastService.error(err.error?.message || 'Failed to load event');
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
