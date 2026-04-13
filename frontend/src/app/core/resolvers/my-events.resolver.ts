import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { EventsResponse } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';

export const myEventsResolver: ResolveFn<EventsResponse | null | RedirectCommand> = (_route, state) => {
	if (!state.url.includes('/manage/')) {
		return of(null);
	}

	const eventService = inject(EventService);
	const router = inject(Router);

	return eventService.getMyEvents().pipe(
		catchError(() => {
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
