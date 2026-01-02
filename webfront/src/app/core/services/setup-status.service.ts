import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { isInitialAdminRequiredError } from '../utils/setup-required.util';
import { FrontendConfigRepository } from '../repositories/frontend-config.repository';
import type { FrontendConfig } from 'bridge';

@Injectable({
  providedIn: 'root',
})
export class SetupStatusService {
  private readonly setupRequired = signal<boolean | null>(null);
  private cachedConfig: FrontendConfig | null = null;

  constructor(private readonly configRepository: FrontendConfigRepository) {}

  isSetupRequired(): boolean | null {
    return this.setupRequired();
  }

  async checkSetupStatus(): Promise<void> {
    try {
      const config = await firstValueFrom(this.configRepository.fetchConfig$());
      this.cachedConfig = config;
      this.setupRequired.set(false);
    } catch (error) {
      this.cachedConfig = null;
      if (isInitialAdminRequiredError(error)) {
        this.markSetupRequired();
        return;
      }
      this.setupRequired.set(false);
    }
  }

  markSetupComplete(): void {
    this.setupRequired.set(false);
  }

  markSetupRequired(): void {
    this.setupRequired.set(true);
  }

  consumeConfig(): FrontendConfig | null {
    const config = this.cachedConfig;
    this.cachedConfig = null;
    return config;
  }
}
