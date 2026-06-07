import { Routes } from '@angular/router';
import { userDetailResolver } from 'src/app/core/resolvers/user-detail.resolver';
import { usersResolver } from 'src/app/core/resolvers/users.resolver';
import { ExportComponent } from './export/export.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { UserManagementComponent } from './user-management/user-management.component';

export const ADMIN_ROUTES: Routes = [
	{
		path: 'users',
		component: UserManagementComponent,
		resolve: { usersData: usersResolver },
		runGuardsAndResolvers: 'always'
	},
	{
		path: 'users/:id',
		component: UserDetailComponent,
		resolve: { userData: userDetailResolver },
		runGuardsAndResolvers: 'always'
	},
	{
		path: 'export',
		component: ExportComponent
	}
];
