import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  imports: [RouterLink, ButtonComponent],
})
export class VerifyEmailComponent {
  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly message = signal('Vérification en cours...');
  readonly returnUrl = signal<string | null>(null);
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: this.route.snapshot.queryParams });
  private lastSignature: string | null = null;

  constructor(private readonly route: ActivatedRoute, private readonly authService: AuthService) {
    effect(() => {
      const params = this.queryParams() as {
        id?: string;
        token?: string;
        expires?: string;
        _hash?: string;
        returnUrl?: string;
      };

      this.returnUrl.set(params.returnUrl ?? null);

      if (!params.id || !params.token || !params.expires || !params._hash) {
        this.status.set('error');
        this.message.set('Lien de vérification invalide.');
        return;
      }

      const signature = [params.id, params.token, params.expires, params._hash].join('|');
      if (this.lastSignature === signature) {
        return;
      }

      this.lastSignature = signature;
      this.status.set('loading');
      this.message.set('Vérification en cours...');

      void this.verifyEmail(params);
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

  private async verifyEmail(params: { id: string; token: string; expires: string; _hash: string }): Promise<void> {
    try {
      await this.authService.verifyEmail(params);
      this.status.set('success');
      this.message.set('Votre adresse email est vérifiée.');
    } catch {
      this.status.set('error');
      this.message.set('Lien expiré ou invalide.');
    }
  }
}
