import { Injectable, signal } from '@angular/core';
import type { UserUserRead } from 'bridge';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly user = signal<UserUserRead | null>(null);
  readonly sessionExp = signal<number | null>(null);

  setSession(user: UserUserRead, exp: number): void {
    this.user.set(user);
    this.sessionExp.set(exp);
  }

  setUser(user: UserUserRead | null): void {
    this.user.set(user);
  }

  setSessionExp(exp: number | null): void {
    this.sessionExp.set(exp);
  }

  clear(): void {
    this.user.set(null);
    this.sessionExp.set(null);
  }
}
