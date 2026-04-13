import { Routes } from '@angular/router';
import { bookingFormResolver } from '../../core/resolvers/booking-form.resolver';
import { myBookingsResolver } from '../../core/resolvers/my-bookings.resolver';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';

export const BOOKINGS_ROUTES: Routes = [
	{
		path: '',
		component: MyBookingsComponent,
		resolve: { bookingsData: myBookingsResolver },
		runGuardsAndResolvers: 'always'
	},
	{
		path: 'new/:id',
		component: BookingFormComponent,
		resolve: { eventData: bookingFormResolver }
	}
];
