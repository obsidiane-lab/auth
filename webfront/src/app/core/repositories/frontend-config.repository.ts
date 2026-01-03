import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BridgeFacade, type FrontendConfig } from 'bridge';

@Injectable({ providedIn: 'root' })
export class FrontendConfigRepository {
  private readonly bridge = inject(BridgeFacade);

  fetchConfig$(): Observable<FrontendConfig> {
    return this.bridge.get$<FrontendConfig>('/config');
  }
}
