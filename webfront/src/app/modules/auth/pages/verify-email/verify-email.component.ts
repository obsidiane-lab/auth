import { Component, computed, effect, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  imports: [RouterLink, TranslateModule, ButtonComponent, AngularSvgIconModule],
})
export class VerifyEmailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly apiErrorService = inject(ApiErrorService);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly messageKey = signal('auth.verifyEmail.message.loading');
  readonly returnUrl = signal<string | null>(null);
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: this.route.snapshot.queryParams });
  private lastSignature: string | null = null;

  constructor() {
    effect(() => {
      const params = this.queryParams() as {
        id?: string;
        token?: string;
        expires?: string;
        signature?: string;
        _hash?: string;
        returnUrl?: string;
      };

      this.returnUrl.set(params.returnUrl ?? null);

      const signature = params.signature ?? params._hash;

      if (!params.id || !params.token || !params.expires || !signature) {
        this.status.set('error');
        this.messageKey.set('auth.errors.codes.400');
        return;
      }

      const verificationParams = {
        id: params.id,
        token: params.token,
        expires: params.expires,
        signature,
      };

      const requestSignature = [verificationParams.id, verificationParams.token, verificationParams.expires, verificationParams.signature].join('|');
      if (this.lastSignature === requestSignature) {
        return;
      }

      this.lastSignature = requestSignature;
      this.status.set('loading');
      this.messageKey.set('auth.verifyEmail.message.loading');

      void this.verifyEmail(verificationParams);
    });
  }

  readonly loginQueryParams = computed(() => {
    const params: { status?: string; returnUrl?: string } = {};

    if (this.status() === 'success') {
      params.status = 'verified';
    }

    const returnUrl = this.returnUrl();
    if (returnUrl) {
      params.returnUrl = returnUrl;
    }

    return Object.keys(params).length > 0 ? params : null;
  });

  private async verifyEmail(params: { id: string; token: string; expires: string; signature: string }): Promise<void> {
    try {
      await this.authService.verifyEmail(params);
      this.status.set('success');
      this.messageKey.set('auth.verifyEmail.message.success');
    } catch (error) {
      const errorKey = this.apiErrorService.handleError(error);
      if (!errorKey) {
        return;
      }
      this.status.set('error');
      this.messageKey.set(errorKey);
    }
  }
}
