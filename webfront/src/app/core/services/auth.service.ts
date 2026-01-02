import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { UserUserRead } from 'bridge';
import { AuthRepository } from '../repositories/auth.repository';
import { ApiErrorService } from './api-error.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly user = this.authRepository.user;
  readonly sessionExp = this.authRepository.sessionExp;
  readonly checkingSession = signal(false);
  readonly sessionCheckError = signal<string | null>(null);
  private sessionChecked = false;
  private sessionCheckPromise: Promise<boolean> | null = null;
  private readonly sessionCheckTimeoutMs = 2500;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly apiErrorService: ApiErrorService,
  ) {}

  async login(email: string, password: string): Promise<{ user: UserUserRead; exp: number }> {
    return firstValueFrom(this.authRepository.login$(email, password));
  }

  async register(email: string, password: string): Promise<{ user: UserUserRead }> {
    return firstValueFrom(this.authRepository.register$(email, password));
  }

  async me(): Promise<UserUserRead> {
    const response = await firstValueFrom(this.authRepository.me$());
    return response.user;
  }

  async checkSessionOnce(): Promise<boolean> {
    if (this.sessionChecked) {
      return this.user() !== null;
    }
    if (this.sessionCheckPromise) {
      return this.sessionCheckPromise;
    }

    this.checkingSession.set(true);
    this.sessionCheckError.set(null);
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      this.checkingSession.set(false);
    }, this.sessionCheckTimeoutMs);

    this.sessionCheckPromise = (async () => {
      try {
        await this.me();
        return true;
      } catch (error) {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          return false;
        }
        this.sessionCheckError.set(this.apiErrorService.handleError(error));
        return false;
      } finally {
        this.sessionChecked = true;
        if (!timedOut) {
          this.checkingSession.set(false);
        }
        clearTimeout(timeoutId);
        this.sessionCheckPromise = null;
      }
    })();

    return this.sessionCheckPromise;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.authRepository.logout$());
  }

  async refresh(): Promise<number> {
    const response = await firstValueFrom(this.authRepository.refresh$());
    return response.exp;
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(this.authRepository.forgotPassword$(email));
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await firstValueFrom(this.authRepository.resetPassword$(token, password));
  }

  async invite(email: string): Promise<void> {
    await firstValueFrom(this.authRepository.invite$(email));
  }

  async inviteComplete(token: string, password: string, confirmPassword: string): Promise<UserUserRead> {
    const response = await firstValueFrom(this.authRepository.inviteComplete$(token, password, confirmPassword));
    return response.user;
  }

  async verifyEmail(params: { id: string; token: string; expires: string; _hash: string }): Promise<void> {
    await firstValueFrom(this.authRepository.verifyEmail$(params));
  }

  async invitePreview(token: string): Promise<{ email?: string | null; accepted?: boolean; expired?: boolean }> {
    return firstValueFrom(this.authRepository.invitePreview$(token));
  }
}
