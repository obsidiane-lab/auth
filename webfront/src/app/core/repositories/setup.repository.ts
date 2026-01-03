import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BridgeFacade, UserUserRead } from 'bridge';

@Injectable({
  providedIn: 'root',
})
export class SetupRepository {
  private readonly bridge = inject(BridgeFacade);

  createInitialAdmin$(email: string, password: string): Observable<{ user: UserUserRead }> {
    return this.bridge.post$<{ user: UserUserRead }, { email: string; password: string }>('/setup/admin', { email, password });
  }
}
