import type { CsrfTokens as SecurityCsrfTokens, CsrfTokenId } from '../../types/security';

export interface AuthEndpoints {
  login: string;
  register: string;
  request: string;
  reset: string;
  refresh?: string;
  csrf: string;
}

export interface AuthPages {
  login: string;
  register: string;
  forgot: string;
  reset: string;
}

export interface FeatureFlagsConfig {
  registrationEnabled: boolean;
}

export type CsrfTokens = SecurityCsrfTokens;
export type AuthCsrfTokenId = CsrfTokenId;

export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface NewPasswordForm {
  password: string;
  confirmPassword: string;
}
