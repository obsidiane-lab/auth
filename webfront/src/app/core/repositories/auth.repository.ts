import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthInviteCompleteInputInviteComplete,
  AuthInviteUserInputInviteSend,
  AuthRegisterUserInputUserRegister,
  BridgeFacade,
  UserUserRead,
} from 'bridge';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  readonly user = this.store.user;
  readonly sessionExp = this.store.sessionExp;

  constructor(
    private readonly bridge: BridgeFacade,
    private readonly store: AuthStore,
  ) {}

  login$(email: string, password: string): Observable<{ user: UserUserRead; exp: number }> {
    return this.bridge
      .post$<{ user: UserUserRead; exp: number }, { email: string; password: string }>('/auth/login', { email, password })
      .pipe(tap(({ user, exp }) => this.store.setSession(user, exp)));
  }

  register$(email: string, password: string): Observable<{ user: UserUserRead }> {
    const payload: AuthRegisterUserInputUserRegister = { email, password };
    return this.bridge.post$<{ user: UserUserRead }, AuthRegisterUserInputUserRegister>('/auth/register', payload);
  }

  me$(): Observable<{ user: UserUserRead }> {
    return this.bridge.get$<{ user: UserUserRead }>('/auth/me').pipe(tap(({ user }) => this.store.setUser(user)));
  }

  logout$(): Observable<void> {
    return this.bridge.post$<void, Record<string, never>>('/auth/logout', {}).pipe(tap(() => this.store.clear()));
  }

  refresh$(): Observable<{ exp: number }> {
    return this.bridge.post$<{ exp: number }, Record<string, never>>('/auth/refresh', {}).pipe(tap(({ exp }) => this.store.setSessionExp(exp)));
  }

  forgotPassword$(email: string): Observable<{ status: string } | void> {
    return this.bridge.post$<{ status: string }, { email: string }>('/auth/password/forgot', { email });
  }

  resetPassword$(token: string, password: string): Observable<void> {
    return this.bridge.post$<void, { token: string; password: string }>('/auth/password/reset', { token, password });
  }

  invite$(email: string): Observable<{ status: string }> {
    const payload: AuthInviteUserInputInviteSend = { email };
    return this.bridge.post$<{ status: string }, AuthInviteUserInputInviteSend>('/auth/invite', payload);
  }

  inviteComplete$(token: string, password: string, confirmPassword: string): Observable<{ user: UserUserRead }> {
    const payload: AuthInviteCompleteInputInviteComplete = { token, password, confirmPassword };
    return this.bridge.post$<{ user: UserUserRead }, AuthInviteCompleteInputInviteComplete>('/auth/invite/complete', payload);
  }

  verifyEmail$(params: { id: string; token: string; expires: string; _hash: string }): Observable<{ status: string }> {
    return this.bridge.request$<{ status: string }>({
      method: 'GET',
      url: '/auth/verify-email',
      query: params,
    });
  }

  invitePreview$(token: string): Observable<{ email?: string | null; accepted?: boolean; expired?: boolean }> {
    return this.bridge.request$<{ email?: string | null; accepted?: boolean; expired?: boolean }>({
      method: 'GET',
      url: '/auth/invite/preview',
      query: { token },
    });
  }
}
