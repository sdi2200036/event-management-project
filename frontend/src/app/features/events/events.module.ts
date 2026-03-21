import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventFormComponent } from './event-form/event-form.component';

const routes: Routes = [
  { path: '', component: EventListComponent },
  { path: 'new', component: EventFormComponent },
  { path: ':id/edit', component: EventFormComponent },
  { path: ':id', component: EventDetailComponent }
];

@NgModule({
  declarations: [EventListComponent, EventDetailComponent, EventFormComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class EventsModule {}
