import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, of } from 'rxjs';
import { EventCategory, EventFilters, EventsResponseExtended } from 'src/app/shared/models/event.model';
import { EventService } from '../services/event.service';
import { ToastService } from '../services/toast.service';

export const events: ResolveFn<EventsResponseExtended | null | RedirectCommand> = (
	route: ActivatedRouteSnapshot,
	state: RouterStateSnapshot
) => {
	const eventService = inject(EventService);
	const toastService = inject(ToastService);
	const router = inject(Router);
	const params = route.queryParams;

	const isManageMode = route.data['manageMode'] === true;

	const filters: EventFilters = {};
	if (params['title']) filters.title = params['title'];
	if (params['category']) filters.category = params['category'] as EventCategory;
	if (params['location']) filters.location = params['location'];
	if (params['dateFrom']) filters.dateFrom = params['dateFrom'];
	if (params['dateTo']) filters.dateTo = params['dateTo'];
	if (params['minPrice']) filters.minPrice = Number(params['minPrice']);
	if (params['maxPrice']) filters.maxPrice = Number(params['maxPrice']);
	filters.page = params['page'] ? Number(params['page']) : 1;
	filters.limit = params['limit'] ? Number(params['limit']) : 12;

	return isManageMode
		? eventService.getMyEvents().pipe(
				catchError(() => {
					toastService.error('Failed to load your events');
					return of(new RedirectCommand(router.parseUrl('/events')));
				})
			)
		: eventService.getEvents(filters).pipe(
				catchError(() => {
					toastService.error('Failed to load events');
					return of(new RedirectCommand(router.parseUrl('/events')));
				})
			);
};
