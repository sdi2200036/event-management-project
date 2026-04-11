import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'events',
    loadChildren: () => import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
  },
  {
    path: 'manage/events',
    loadChildren: () => import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: 'bookings',
    loadChildren: () => import('./features/bookings/bookings.routes').then((m) => m.BOOKINGS_ROUTES),
    canActivate: [RoleGuard],
    data: { roles: ['participant'] },
  },
  {
    path: 'messages',
    loadChildren: () => import('./features/messaging/messaging.routes').then((m) => m.MESSAGING_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  { path: '**', redirectTo: '' },
];
