import { Routes } from '@angular/router';
import { usersResolver } from 'src/app/core/resolvers/users.resolver';
import { ExportComponent } from './export/export.component';
import { UserManagementComponent } from './user-management/user-management.component';

export const ADMIN_ROUTES: Routes = [
	{
		path: 'users',
		component: UserManagementComponent,
		resolve: { usersData: usersResolver },
		runGuardsAndResolvers: 'always'
	},
	{
		path: 'export',
		component: ExportComponent
	}
];
