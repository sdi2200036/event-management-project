import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/welcome/welcome.module').then((m) => m.WelcomeModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'events',
    loadChildren: () =>
      import('./features/events/events.module').then((m) => m.EventsModule),
  },
  {
    path: 'manage/events',
    loadChildren: () =>
      import('./features/events/events.module').then((m) => m.EventsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'bookings',
    loadChildren: () =>
      import('./features/bookings/bookings.module').then((m) => m.BookingsModule),
    canActivate: [RoleGuard],
    data: { roles: ['participant'] },
  },
  {
    path: 'messages',
    loadChildren: () =>
      import('./features/messaging/messaging.module').then((m) => m.MessagingModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
