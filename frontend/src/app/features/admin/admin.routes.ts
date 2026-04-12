import { Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { ExportComponent } from './export/export.component';

export const ADMIN_ROUTES: Routes = [
	{
		path: 'users',
		component: UserManagementComponent
	},
	{
		path: 'export',
		component: ExportComponent
	}
];
