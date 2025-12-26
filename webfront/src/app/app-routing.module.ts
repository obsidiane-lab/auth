import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/auth/pages/sign-in/sign-in.component').then((m) => m.SignInComponent),
      },
    ],
  },
  {
    path: 'register',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/auth/pages/sign-up/sign-up.component').then((m) => m.SignUpComponent),
      },
    ],
  },
  {
    path: 'two-steps',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/auth/pages/two-steps/two-steps.component').then((m) => m.TwoStepsComponent),
      },
    ],
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/auth/pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'confirm',
        loadComponent: () =>
          import('./modules/auth/pages/new-password/new-password.component').then((m) => m.NewPasswordComponent),
      },
    ],
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/auth/pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
      },
    ],
  },
  {
    path: 'invite',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: 'complete',
        loadComponent: () =>
          import('./modules/auth/pages/invite-complete/invite-complete.component').then(
            (m) => m.InviteCompleteComponent,
          ),
      },
    ],
  },
  {
    path: 'setup',
    loadComponent: () => import('./modules/auth/auth.component').then((m) => m.AuthComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/auth/pages/setup/setup.component').then((m) => m.SetupComponent),
      },
    ],
  },
  {
    path: 'errors',
    loadChildren: () => import('./modules/error/error.module').then((m) => m.ErrorModule),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'errors/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
