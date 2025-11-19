import type { InternalHttpClient } from '../core/httpClient';
import type {
  CompleteInviteResponse,
  InviteStatusResponse,
  LoginResponse,
  MeResponse,
  PasswordForgotResponse,
  RefreshResponse,
  RegisterInput,
  RegisterResponse,
} from '../types';

const PATH_AUTH_ME = '/api/auth/me';
const PATH_AUTH_LOGIN = '/api/auth/login';
const PATH_AUTH_REFRESH = '/api/auth/refresh';
const PATH_AUTH_LOGOUT = '/api/auth/logout';
const PATH_AUTH_REGISTER = '/api/auth/register';
const PATH_AUTH_PASSWORD_FORGOT = '/api/auth/password/forgot';
const PATH_AUTH_PASSWORD_RESET = '/api/auth/password/reset';
const PATH_AUTH_INVITE = '/api/auth/invite';
const PATH_AUTH_INVITE_COMPLETE = '/api/auth/invite/complete';

export class AuthApiClient {
  constructor(private readonly http: InternalHttpClient) {}

  me(signal?: AbortSignal): Promise<MeResponse> {
    return this.http.request<MeResponse>('GET', PATH_AUTH_ME, { signal });
  }

  login(email: string, password: string, signal?: AbortSignal): Promise<LoginResponse> {
    return this.http.request<LoginResponse>('POST', PATH_AUTH_LOGIN, {
      json: { email, password },
      csrf: true,
      signal,
    });
  }

  refresh(csrfToken?: string, signal?: AbortSignal): Promise<RefreshResponse> {
    return this.http.request<RefreshResponse>('POST', PATH_AUTH_REFRESH, {
      csrf: csrfToken ?? false,
      signal,
    });
  }

  logout(signal?: AbortSignal): Promise<void> {
    return this.http.request<void>('POST', PATH_AUTH_LOGOUT, {
      csrf: true,
      signal,
    });
  }

  register(input: RegisterInput, signal?: AbortSignal): Promise<RegisterResponse> {
    return this.http.request<RegisterResponse>('POST', PATH_AUTH_REGISTER, {
      json: input,
      csrf: true,
      signal,
    });
  }

  requestPasswordReset(email: string, signal?: AbortSignal): Promise<PasswordForgotResponse> {
    return this.http.request<PasswordForgotResponse>('POST', PATH_AUTH_PASSWORD_FORGOT, {
      json: { email },
      csrf: true,
      signal,
    });
  }

  resetPassword(token: string, password: string, signal?: AbortSignal): Promise<void> {
    return this.http.request<void>('POST', PATH_AUTH_PASSWORD_RESET, {
      json: { token, password },
      csrf: true,
      signal,
    });
  }

  inviteUser(email: string, signal?: AbortSignal): Promise<InviteStatusResponse> {
    return this.http.request<InviteStatusResponse>('POST', PATH_AUTH_INVITE, {
      json: { email },
      csrf: true,
      signal,
    });
  }

  completeInvite(token: string, password: string, signal?: AbortSignal): Promise<CompleteInviteResponse> {
    return this.http.request<CompleteInviteResponse>('POST', PATH_AUTH_INVITE_COMPLETE, {
      json: {
        token,
        password,
        confirmPassword: password,
      },
      csrf: true,
      signal,
    });
  }
}

