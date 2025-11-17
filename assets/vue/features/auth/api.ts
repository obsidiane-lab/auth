import axios from 'axios';
import { http, jsonConfig } from '../../utils/http';
import type {
  AuthEndpoints,
  ForgotPasswordForm,
  NewPasswordForm,
  SignInForm,
  SignUpForm,
} from './types';
import type { ApiErrorPayload } from './composables/useApiErrors';

export interface AuthApiClient {
  login(payload: SignInForm): Promise<void>;
  register(payload: SignUpForm): Promise<void>;
  requestPasswordReset(payload: ForgotPasswordForm): Promise<void>;
  resetPassword(payload: NewPasswordPayload): Promise<void>;
}

export interface NewPasswordPayload extends NewPasswordForm {
  token: string;
}

interface AuthApiErrorOptions {
  status?: number;
  payload?: ApiErrorPayload | null;
  cause?: unknown;
}

export class AuthApiError extends Error {
  status?: number;
  payload: ApiErrorPayload | null;
  cause?: unknown;

  constructor(message: string, options: AuthApiErrorOptions = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.status = options.status;
    this.payload = options.payload ?? null;
    this.cause = options.cause;
  }
}

const assertEndpoint = (endpoint: string, name: string): string => {
  if (typeof endpoint !== 'string' || endpoint.trim() === '') {
    throw new Error(`Missing auth endpoint for "${name}".`);
  }

  return endpoint;
};

const normalizeApiError = (error: unknown): AuthApiError => {
  if (error instanceof AuthApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const payload = (error.response?.data ?? null) as ApiErrorPayload | null;
    return new AuthApiError(error.message, {
      status: error.response?.status,
      payload,
      cause: error,
    });
  }

  return new AuthApiError('Unexpected error.', { cause: error });
};

export const createAuthApi = (endpoints: AuthEndpoints): AuthApiClient => {
  const login: AuthApiClient['login'] = async (payload) => {
    try {
      await http.post(
        assertEndpoint(endpoints.login, 'login'),
        {
          email: payload.email,
          password: payload.password,
        },
        jsonConfig(true),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const register: AuthApiClient['register'] = async (payload) => {
    try {
      await http.post(
        assertEndpoint(endpoints.register, 'register'),
        {
          email: payload.email,
          password: payload.password,
        },
        jsonConfig(true),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const requestPasswordReset: AuthApiClient['requestPasswordReset'] = async (payload) => {
    try {
      await http.post(
        assertEndpoint(endpoints.request, 'password request'),
        {
          email: payload.email,
        },
        jsonConfig(true),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const resetPassword: AuthApiClient['resetPassword'] = async (payload) => {
    try {
      await http.post(
        assertEndpoint(endpoints.reset, 'password reset'),
        {
          token: payload.token,
          password: payload.password,
        },
        jsonConfig(true),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  return {
    login,
    register,
    requestPasswordReset,
    resetPassword,
  };
};
