import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UserUserRead } from 'bridge';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly user = this.authRepository.user;
  readonly sessionExp = this.authRepository.sessionExp;

  constructor(private readonly authRepository: AuthRepository) {}

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
