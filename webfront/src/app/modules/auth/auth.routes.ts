import { Routes } from '@angular/router';

const authShell = () => import('./auth.component').then((m) => m.AuthComponent);
const signIn = () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent);
const signUp = () => import('./pages/sign-up/sign-up.component').then((m) => m.SignUpComponent);
const twoSteps = () => import('./pages/two-steps/two-steps.component').then((m) => m.TwoStepsComponent);
const forgotPassword = () => import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent);
const newPassword = () => import('./pages/new-password/new-password.component').then((m) => m.NewPasswordComponent);
const verifyEmail = () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent);
const inviteComplete = () => import('./pages/invite-complete/invite-complete.component').then((m) => m.InviteCompleteComponent);
const setup = () => import('./pages/setup/setup.component').then((m) => m.SetupComponent);

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: authShell,
    children: [{ path: '', loadComponent: signIn }],
  },
  {
    path: 'register',
    loadComponent: authShell,
    children: [{ path: '', loadComponent: signUp }],
  },
  {
    path: 'two-steps',
    loadComponent: authShell,
    children: [{ path: '', loadComponent: twoSteps }],
  },
  {
    path: 'reset-password',
    loadComponent: authShell,
    children: [
      { path: '', loadComponent: forgotPassword },
      { path: 'confirm', loadComponent: newPassword },
    ],
  },
  {
    path: 'verify-email',
    loadComponent: authShell,
    children: [{ path: '', loadComponent: verifyEmail }],
  },
  {
    path: 'invite',
    loadComponent: authShell,
    children: [{ path: 'complete', loadComponent: inviteComplete }],
  },
  {
    path: 'setup',
    loadComponent: authShell,
    children: [{ path: '', loadComponent: setup }],
  },
];
