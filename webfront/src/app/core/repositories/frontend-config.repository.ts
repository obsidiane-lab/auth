import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BridgeFacade, type FrontendConfig } from 'bridge';

@Injectable({ providedIn: 'root' })
export class FrontendConfigRepository {
  constructor(private readonly bridge: BridgeFacade) {}

  fetchConfig$(): Observable<FrontendConfig> {
    return this.bridge.get$<FrontendConfig>('/config');
  }
}
