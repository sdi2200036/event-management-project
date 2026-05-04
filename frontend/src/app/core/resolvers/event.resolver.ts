import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Event as EventModel } from 'src/app/shared/models/event.model';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { ToastService } from '../services/toast.service';

export const eventResolver: ResolveFn<EventModel | null | RedirectCommand> = (route, state: RouterStateSnapshot) => {
	const id: string | null = route.paramMap.get('id');

	// Create mode — no data to pre-fetch
	if (!id) {
		return of(null);
	}

	const eventService: EventService = inject(EventService);
	const authService: AuthService = inject(AuthService);
	const router: Router = inject(Router);
	const toastService: ToastService = inject(ToastService);
	const eventId: number = Number(id);

	if (isNaN(eventId)) {
		return new RedirectCommand(router.parseUrl('/events'));
	}

	const isManageMode = state.url.includes('/manage');

	return eventService.getEvent(eventId).pipe(
		map((event) => {
			if (isManageMode) {
				const user = authService.currentUser();
				if (!user || event.organizer_id !== user.id) {
					toastService.error('You do not have access to this event');
					return new RedirectCommand(router.parseUrl('/events/manage'));
				}
			}
			return event;
		}),
		catchError(() => {
			toastService.error('Failed to load event');
			return of(new RedirectCommand(router.parseUrl('/events')));
		})
	);
};
