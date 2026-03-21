import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MessagingComponent } from './messaging.component';

const routes: Routes = [
  { path: '', component: MessagingComponent }
];

@NgModule({
  declarations: [MessagingComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class MessagingModule {}
