import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Event as EventModel } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';
import { ToastService } from '../services/toast.service';

export const eventResolver: ResolveFn<EventModel | null | RedirectCommand> = (route) => {
	const id = route.paramMap.get('id');

	// Create mode — no data to pre-fetch
	if (!id) {
		return of(null);
	}

	const eventService = inject(EventService);
	const router = inject(Router);
	const toastService = inject(ToastService);
	const eventId = Number(id);

	if (isNaN(eventId)) {
		return new RedirectCommand(router.parseUrl('/events/manage'));
	}

	return eventService.getEvent(eventId).pipe(
		catchError(() => {
			toastService.error('Failed to load event');
			return of(new RedirectCommand(router.parseUrl('/events/manage')));
		})
	);
};
