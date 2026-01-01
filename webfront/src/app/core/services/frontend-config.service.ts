import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BridgeFacade } from 'bridge';
import type { FrontendConfig } from '../models/frontend-config.model';

const DEFAULT_CONFIG: FrontendConfig = {
  registrationEnabled: true,
  passwordStrengthLevel: 2,
  brandingName: 'Obsidiane Auth',
  frontendDefaultRedirect: '',
  frontendRedirectAllowlist: [],
  themeMode: 'dark',
  themeColor: 'base',
  themeDirection: 'ltr',
  themeColors: ['base', 'red', 'blue', 'orange', 'yellow', 'green', 'violet'],
};

@Injectable({ providedIn: 'root' })
export class FrontendConfigService {
  private readonly configSignal = signal<FrontendConfig>(DEFAULT_CONFIG);
  private readonly loadedSignal = signal(false);
  private readonly loadingSignal = signal(false);

  readonly config = computed(() => this.configSignal());
  readonly loaded = computed(() => this.loadedSignal());
  readonly loading = computed(() => this.loadingSignal());

  constructor(private readonly bridge: BridgeFacade) {}

  async loadOnce(): Promise<FrontendConfig> {
    if (this.loadingSignal() || this.loadedSignal()) {
      return this.configSignal();
    }

    this.loadingSignal.set(true);
    try {
      const config = await firstValueFrom(this.bridge.get$<FrontendConfig>('/config'));
      this.configSignal.set({ ...DEFAULT_CONFIG, ...config });
      this.loadedSignal.set(true);
      return this.configSignal();
    } catch {
      this.loadedSignal.set(false);
      return this.configSignal();
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
