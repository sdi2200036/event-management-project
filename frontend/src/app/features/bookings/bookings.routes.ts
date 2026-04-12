import { Routes } from '@angular/router';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';

export const BOOKINGS_ROUTES: Routes = [
	{ path: '', component: MyBookingsComponent },
	{ path: 'new/:id', component: BookingFormComponent }
];
