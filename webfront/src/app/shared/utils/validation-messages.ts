import { FieldError } from '../components/form-field/form-field.component';

/**
 * Centralized validation messages using translation keys
 */
export const ValidationMessages = {
  email: (): FieldError[] => [
    { key: 'required', message: 'form.validation.email.required' },
    { key: 'email', message: 'form.validation.email.invalid' },
  ],
} as const;

/**
 * Success messages translation keys
 */
export const SuccessMessages = {
  accountCreated: 'form.messages.success.accountCreated',
  emailVerified: 'form.messages.success.emailVerified',
  passwordUpdated: 'form.messages.success.passwordUpdated',
  loginSuccess: 'form.messages.success.loginSuccess',
  loginSuccessClose: 'form.messages.success.loginSuccessClose',
  invitationConfirmed: 'form.messages.success.invitationConfirmed',
  adminCreated: 'form.messages.success.adminCreated',
  accountActivated: 'form.messages.success.accountActivated',
  resetEmailSent: 'form.messages.success.resetEmailSent',
  invitationAlreadyUsed: 'form.messages.success.invitationAlreadyUsed',
} as const;
