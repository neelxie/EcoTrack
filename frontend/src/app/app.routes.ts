import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then(
        (m) => m.DashboardModule,
      ),
  },
  {
    path: 'stations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/stations/stations.module').then(
        (m) => m.StationsModule,
      ),
  },
  {
    path: 'readings',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/readings/readings.module').then(
        (m) => m.ReadingsModule,
      ),
  },
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/alerts/alerts.module').then((m) => m.AlertsModule),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reports/reports.module').then((m) => m.ReportsModule),
  },
  { path: '**', redirectTo: 'dashboard' },
];
