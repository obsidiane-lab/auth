import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BridgeFacade, UserUserRead } from 'bridge';

@Injectable({
  providedIn: 'root',
})
export class SetupRepository {
  constructor(private readonly bridge: BridgeFacade) {}

  createInitialAdmin$(email: string, password: string): Observable<{ user: UserUserRead }> {
    return this.bridge.post$<{ user: UserUserRead }, { email: string; password: string }>('/setup/admin', { email, password });
  }
}
