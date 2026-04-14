import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Event as EventModel } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';
import { ToastService } from '../services/toast.service';

export const bookingFormResolver: ResolveFn<EventModel | RedirectCommand> = (route) => {
	const eventService = inject(EventService);
	const router = inject(Router);
	const toastService = inject(ToastService);
	const id = Number(route.paramMap.get('id'));

	if (!id || isNaN(id)) {
		return new RedirectCommand(router.parseUrl('/events'));
	}

	return eventService.getEvent(id).pipe(
		catchError(() => {
			toastService.error('Failed to load event');
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
