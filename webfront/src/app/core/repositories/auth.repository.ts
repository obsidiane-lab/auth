import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthInviteCompleteInputInviteComplete,
  AuthRegisterUserInputUserRegister,
  BridgeFacade,
  UserUserRead,
} from 'bridge';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  private readonly bridge = inject(BridgeFacade);
  private readonly store = inject(AuthStore);
  readonly user = this.store.user;

  login$(email: string, password: string): Observable<{ user: UserUserRead; exp: number }> {
    return this.bridge
      .post$<{ user: UserUserRead; exp: number }, { email: string; password: string }>('/auth/login', { email, password })
      .pipe(tap(({ user }) => this.store.setSession(user)));
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

  forgotPassword$(email: string): Observable<{ status: string } | void> {
    return this.bridge.post$<{ status: string }, { email: string }>('/auth/password/forgot', { email });
  }

  resetPassword$(token: string, password: string): Observable<void> {
    return this.bridge.post$<void, { token: string; password: string }>('/auth/password/reset', { token, password });
  }

  inviteComplete$(token: string, password: string, confirmPassword: string): Observable<{ user: UserUserRead }> {
    const payload: AuthInviteCompleteInputInviteComplete = { token, password, confirmPassword };
    return this.bridge.post$<{ user: UserUserRead }, AuthInviteCompleteInputInviteComplete>('/auth/invite/complete', payload);
  }

  verifyEmail$(params: { id: string; token: string; expires: string; signature: string }): Observable<{ status: string }> {
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
