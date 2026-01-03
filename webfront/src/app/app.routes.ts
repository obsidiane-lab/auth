import { Routes } from '@angular/router';
import { authRoutes } from './modules/auth/auth.routes';
import { errorRoutes } from './modules/error/error.routes';

export const appRoutes: Routes = [
  ...authRoutes,
  ...errorRoutes,
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'errors/404' },
];
