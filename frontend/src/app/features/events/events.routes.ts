import { Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventFormComponent } from './event-form/event-form.component';

export const EVENTS_ROUTES: Routes = [
	{ path: '', component: EventListComponent },
	{ path: 'new', component: EventFormComponent },
	{ path: ':id/edit', component: EventFormComponent },
	{ path: ':id', component: EventDetailComponent }
];
