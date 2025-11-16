
export interface AuthEndpoints {
  login: string;
  register: string;
  request: string;
  reset: string;
  refresh?: string;
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
