import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { isInternalPath } from '../../../../core/utils/redirect-policy.util';

@Component({
  selector: 'app-already-authenticated',
  templateUrl: './already-authenticated.component.html',
  standalone: true,
  imports: [ButtonComponent],
})
export class AlreadyAuthenticatedComponent {
  @Input() redirectTarget: string | null = null;

  alreadyAuthenticated = false;
  checkingSession = false;
  logoutLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    void this.checkSession();
  }

  async checkSession(): Promise<void> {
    this.checkingSession = true;
    try {
      await this.authService.me();
      this.alreadyAuthenticated = true;
    } catch {
      this.alreadyAuthenticated = false;
    } finally {
      this.checkingSession = false;
    }
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
    if (this.logoutLoading) {
      return;
    }

    this.logoutLoading = true;
    try {
      await this.authService.logout();
    } finally {
      this.logoutLoading = false;
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }
}
