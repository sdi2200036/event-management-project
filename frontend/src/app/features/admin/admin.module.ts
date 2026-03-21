import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { ExportComponent } from './export/export.component';

const routes: Routes = [
  { path: 'users', component: UserManagementComponent },
  { path: 'export', component: ExportComponent }
];

@NgModule({
  declarations: [UserManagementComponent, ExportComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
