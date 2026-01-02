import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { extractHttpStatus } from '../utils/http-error.util';
import { SetupStatusService } from './setup-status.service';
import { isInitialAdminRequiredError } from '../utils/setup-required.util';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  constructor(
    private readonly router: Router,
    private readonly setupStatusService: SetupStatusService,
  ) {}

  handleError(error: unknown): string {
    if (this.isSetupRequired(error)) {
      this.handleSetupRequired();
      return '';
    }

    const status = extractHttpStatus(error);
    return `auth.errors.codes.${status ?? 500}`;
  }

  private isSetupRequired(error: unknown): boolean {
    return isInitialAdminRequiredError(error);
  }

  private handleSetupRequired(): void {
    this.setupStatusService.markSetupRequired();
    if (this.router.url.startsWith('/setup')) {
      return;
    }
    void this.router.navigate(['/setup']);
  }
}
