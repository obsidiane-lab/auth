import { Injectable, signal } from '@angular/core';
import type { UserUserRead } from 'bridge';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly user = signal<UserUserRead | null>(null);

  setSession(user: UserUserRead): void {
    this.user.set(user);
  }

  setUser(user: UserUserRead | null): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
  }
}
