import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { FrontendConfig } from 'bridge';
import { FrontendConfigRepository } from '../repositories/frontend-config.repository';
import { SetupStatusService } from './setup-status.service';

const DEFAULT_CONFIG: FrontendConfig = {
  environment: 'prod',
  registrationEnabled: true,
  passwordStrengthLevel: 2,
  brandingName: 'Obsidiane Auth',
  frontendRedirectUrl: '',
  themeMode: 'dark',
  themeColor: 'base',
};

@Injectable({ providedIn: 'root' })
export class FrontendConfigService {
  private readonly configRepository = inject(FrontendConfigRepository);
  private readonly setupStatusService = inject(SetupStatusService);
  private readonly configSignal = signal<FrontendConfig>(DEFAULT_CONFIG);
  private readonly loadedSignal = signal(false);
  private readonly loadingSignal = signal(false);

  readonly config = computed(() => this.configSignal());

  async loadOnce(): Promise<FrontendConfig> {
    if (this.loadingSignal() || this.loadedSignal()) {
      return this.configSignal();
    }

    const cachedConfig = this.setupStatusService.consumeConfig();
    if (cachedConfig) {
      this.configSignal.set({ ...DEFAULT_CONFIG, ...cachedConfig });
      this.loadedSignal.set(true);
      return this.configSignal();
    }

    const setupRequired = this.setupStatusService.isSetupRequired();

    // Si le setup est requis OU si on ne sait pas encore (null), ne pas faire l'appel
    if (setupRequired === true || setupRequired === null) {
      return this.configSignal();
    }

    this.loadingSignal.set(true);
    try {
      const config = await firstValueFrom(this.configRepository.fetchConfig$());
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
