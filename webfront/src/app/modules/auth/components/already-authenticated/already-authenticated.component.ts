import { Component, Input, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { isInternalPath } from '../../../../core/utils/redirect-policy.util';
import { ApiErrorService } from '../../../../core/services/api-error.service';

@Component({
  selector: 'app-already-authenticated',
  templateUrl: './already-authenticated.component.html',
  standalone: true,
  imports: [ButtonComponent, TranslateModule],
})
export class AlreadyAuthenticatedComponent {
  @Input() redirectTarget: string | null = null;

  readonly alreadyAuthenticated = computed(() => this.authService.user() !== null);
  readonly checkingSession = this.authService.checkingSession;
  readonly sessionCheckError = this.authService.sessionCheckError;
  readonly logoutLoading = signal(false);
  readonly logoutError = signal<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly apiErrorService: ApiErrorService,
  ) {
    void this.authService.checkSessionOnce();
  }

  goToService(): void {
    if (!this.redirectTarget) {
      return;
    }

    if (isInternalPath(this.redirectTarget)) {
      void this.router.navigateByUrl(this.redirectTarget);
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign(this.redirectTarget);
    }
  }

  async logout(): Promise<void> {
    if (this.logoutLoading()) {
      return;
    }

    this.logoutLoading.set(true);
    this.logoutError.set(null);
    try {
      await this.authService.logout();
    } catch (error) {
      this.logoutError.set(this.apiErrorService.handleError(error));
    } finally {
      this.logoutLoading.set(false);
      if (this.authService.user() === null) {
        this.checkingSession.set(false);
      }
    }
  }
}
