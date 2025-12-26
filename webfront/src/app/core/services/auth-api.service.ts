import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BridgeFacade } from '@decodeur/bridge';

export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
  emailVerified: boolean;
  lastLoginAt?: string | null;
}

export interface AuthSessionResponse {
  user: AuthUser;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  constructor(private readonly bridge: BridgeFacade) {}

  login(email: string, password: string): Observable<AuthSessionResponse> {
    return this.bridge.post$<AuthSessionResponse, { email: string; password: string }>('/auth/login', { email, password });
  }

  register(email: string, password: string): Observable<{ user: AuthUser }> {
    return this.bridge.post$<{ user: AuthUser }, { email: string; password: string }>('/auth/register', { email, password });
  }

  me(): Observable<{ user: AuthUser }> {
    return this.bridge.get$<{ user: AuthUser }>('/auth/me');
  }

  logout(): Observable<void> {
    return this.bridge.post$<void, Record<string, never>>('/auth/logout', {});
  }

  refresh(): Observable<{ exp: number }> {
    return this.bridge.post$<{ exp: number }, Record<string, never>>('/auth/refresh', {});
  }

  forgotPassword(email: string): Observable<{ status: string } | void> {
    return this.bridge.post$<{ status: string }, { email: string }>('/auth/password/forgot', { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.bridge.post$<void, { token: string; password: string }>('/auth/password/reset', { token, password });
  }

  invite(email: string): Observable<{ status: string }> {
    return this.bridge.post$<{ status: string }, { email: string }>('/auth/invite', { email });
  }

  inviteComplete(token: string, password: string, confirmPassword: string): Observable<{ user: AuthUser }> {
    return this.bridge.post$<{ user: AuthUser }, { token: string; password: string; confirmPassword: string }>('/auth/invite/complete', {
      token,
      password,
      confirmPassword,
    });
  }

  setupInitialAdmin(email: string, password: string): Observable<{ user: AuthUser }> {
    return this.bridge.post$<{ user: AuthUser }, { email: string; password: string }>('/setup/admin', { email, password });
  }

  verifyEmail(params: { id: string; token: string; expires: string; _hash: string }): Observable<{ status: string }> {
    return this.bridge.request$<{ status: string }>({
      method: 'GET',
      url: '/auth/verify-email',
      query: params,
    });
  }
}
