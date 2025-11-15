import type { FeatureFlagsConfig } from './types';

export const COMMON_UNEXPECTED_ERROR_KEY = 'common.error.unexpected';

export const LOGIN_ERROR_KEYS: Record<string, string> = {
  INVALID_CREDENTIALS: 'auth.login.error.api.INVALID_CREDENTIALS',
  INVALID_PAYLOAD: 'auth.login.error.api.INVALID_PAYLOAD',
  RATE_LIMIT: 'auth.login.error.api.RATE_LIMIT',
  CSRF_TOKEN_INVALID: 'common.error.csrf_token_invalid',
  EMAIL_NOT_VERIFIED: 'auth.login.error.api.EMAIL_NOT_VERIFIED',
  UNKNOWN: 'auth.login.error.api.UNKNOWN',
};

export const LOGIN_SUCCESS_KEY = 'auth.login.message.success';
export const LOGIN_REDIRECT_KEY = 'auth.login.message.redirecting';

export const REGISTER_ERROR_KEYS: Record<string, string> = {
  EMAIL_ALREADY_USED: 'register.error.email_exists',
  INVALID_EMAIL: 'register.error.invalid_email',
  DISPLAY_NAME_REQUIRED: 'register.error.display_name_required',
  INVALID_PASSWORD: 'register.error.invalid_password',
  MISSING_IDENTITY: 'register.error.missing_identity',
  CSRF_TOKEN_INVALID: 'common.error.csrf_token_invalid',
  INVALID_PAYLOAD: 'common.error.invalid_payload',
  TOKEN_ID_INVALID: 'common.error.invalid_csrf_token_id',
  EMAIL_SEND_FAILED: 'password.request.error.email_send_failed',
  INITIAL_ADMIN_REQUIRED: 'register.error.initial_admin_required',
  INITIAL_ADMIN_ALREADY_CREATED: 'register.error.initial_admin_required',
  UNKNOWN: 'register.error.generic',
};

export const REGISTER_SUCCESS_KEY = 'auth.register.message.success';

export const PASSWORD_REQUEST_ERROR_KEYS: Record<string, string> = {
  EMAIL_SEND_FAILED: 'password.request.error.email_send_failed',
  RESET_REQUEST_FAILED: 'password.request.error.generic',
  RATE_LIMIT: 'password.request.error.generic',
  INITIAL_ADMIN_REQUIRED: 'password.request.error.initial_admin_required',
  INITIAL_ADMIN_ALREADY_CREATED: 'password.request.error.initial_admin_required',
  UNKNOWN: 'password.request.error.generic',
};

export const PASSWORD_REQUEST_SUCCESS_KEY = 'password.request.message.success';

export const PASSWORD_RESET_ERROR_KEYS: Record<string, string> = {
  INVALID_REQUEST: 'password.reset.error.api.INVALID_REQUEST',
  INVALID_TOKEN: 'password.reset.error.api.INVALID_TOKEN',
  EMPTY_PASSWORD: 'password.reset.error.api.EMPTY_PASSWORD',
  EMAIL_MISSING: 'password.reset.error.api.UNKNOWN',
  UNKNOWN: 'password.reset.error.api.UNKNOWN',
  CSRF_TOKEN_INVALID: 'common.error.csrf_token_invalid',
  INVALID_PAYLOAD: 'common.error.invalid_payload',
  INVALID_USER: 'password.reset.error.api.INVALID_TOKEN',
  INITIAL_ADMIN_REQUIRED: 'common.error.initial_admin_required',
  INITIAL_ADMIN_ALREADY_CREATED: 'common.error.initial_admin_required',
};

export const PASSWORD_RESET_SUCCESS_KEY = 'password.reset.message.success';
export const PASSWORD_POLICY_KEY = 'register.error.invalid_password';
export const PASSWORD_MISMATCH_KEY = 'password.reset.error.mismatch';

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  registrationEnabled: true,
};
