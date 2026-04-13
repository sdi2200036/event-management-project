import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Event as EventModel } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';

export const eventDetailResolver: ResolveFn<EventModel | RedirectCommand> = (route) => {
	const eventService = inject(EventService);
	const router = inject(Router);
	const id = Number(route.paramMap.get('id'));

	if (!id || isNaN(id)) {
		return new RedirectCommand(router.parseUrl('/events'));
	}

	return eventService.getEvent(id).pipe(
		catchError(() => {
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
