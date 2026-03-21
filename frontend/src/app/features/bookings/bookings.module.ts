import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BookingFormComponent } from './booking-form/booking-form.component';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';

const routes: Routes = [
  { path: '', component: MyBookingsComponent },
  { path: 'new', component: BookingFormComponent }
];

@NgModule({
  declarations: [BookingFormComponent, MyBookingsComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class BookingsModule {}
