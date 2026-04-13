import { Routes } from '@angular/router';
import { eventDetailResolver } from '../../core/resolvers/event-detail.resolver';
import { eventFormResolver } from '../../core/resolvers/event-form.resolver';
import { myEventsResolver } from '../../core/resolvers/my-events.resolver';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventFormComponent } from './event-form/event-form.component';
import { EventListComponent } from './event-list/event-list.component';

export const EVENTS_ROUTES: Routes = [
	{
		path: '',
		component: EventListComponent,
		resolve: { myEventsData: myEventsResolver }
	},
	{
		path: 'new',
		component: EventFormComponent
	},
	{
		path: ':id/edit',
		component: EventFormComponent,
		resolve: { eventData: eventFormResolver }
	},
	{
		path: ':id',
		component: EventDetailComponent,
		resolve: { eventData: eventDetailResolver }
	}
];
