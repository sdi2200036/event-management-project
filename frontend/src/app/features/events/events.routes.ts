import { Routes } from '@angular/router';
import { RoleGuard } from 'src/app/core/guards/role.guard';
import { recommendedEventsResolver } from 'src/app/core/resolvers/recommended-events.resolver';
import { UserRole } from 'src/app/shared/models/user.model';
import { eventListFiltersGuard } from '../../core/guards/event-list-filters.guard';
import { eventResolver } from '../../core/resolvers/event.resolver';
import { events } from '../../core/resolvers/events.resolver';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventFormComponent } from './event-form/event-form.component';
import { MyEventsListComponent } from './my-events-list/my-events-list.component';
import { PublicEventsListComponent } from './public-events-list/public-events-list.component';

export const EVENTS_ROUTES: Routes = [
	{
		path: 'public',
		children: [
			{
				path: '',
				component: PublicEventsListComponent,
				canActivate: [eventListFiltersGuard],
				resolve: { eventsData: events, recommendedEventsData: recommendedEventsResolver },
				runGuardsAndResolvers: 'paramsOrQueryParamsChange'
			},
			{
				path: ':id',
				component: EventDetailComponent,
				resolve: { eventData: eventResolver }
			}
		]
	},
	{
		path: 'manage',
		canActivate: [RoleGuard],
		data: { roles: [UserRole.Organizer] },
		children: [
			{
				path: '',
				component: MyEventsListComponent,
				canActivate: [eventListFiltersGuard],
				resolve: { eventsData: events },
				runGuardsAndResolvers: 'always'
			},
			{
				path: 'new',
				component: EventFormComponent
			},
			{
				path: ':id/edit',
				component: EventFormComponent,
				resolve: { eventData: eventResolver }
			},
			{
				path: ':id',
				component: EventDetailComponent,
				resolve: { eventData: eventResolver }
			}
		]
	},
	{
		path: '**',
		redirectTo: 'public'
	}
];
