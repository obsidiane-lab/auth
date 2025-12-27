import { Routes } from '@angular/router';

const errorShell = () => import('./error.component').then((m) => m.ErrorComponent);
const error404 = () => import('./pages/error404/error404.component').then((m) => m.Error404Component);
const error500 = () => import('./pages/error500/error500.component').then((m) => m.Error500Component);

export const errorRoutes: Routes = [
  {
    path: 'errors',
    loadComponent: errorShell,
    children: [
      { path: '', redirectTo: '404', pathMatch: 'full' },
      { path: '404', loadComponent: error404 },
      { path: '500', loadComponent: error500 },
    ],
  },
];
