import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { EventsResponse } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';
import { ToastService } from '../services/toast.service';

export const recommendedEventsResolver: ResolveFn<EventsResponse> = () => {
	const recommendationsToFetch = 6;

	const eventService = inject(EventService);
	const toastService = inject(ToastService);

	return eventService.getRecommendations(recommendationsToFetch).pipe(
		catchError(() => {
			toastService.error('Failed to fetch recommended events.');
			return of({ events: [] });
		})
	);
};
