import { Component, effect } from '@angular/core';
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
  status: 'loading' | 'success' | 'error' = 'loading';
  message = 'Vérification en cours...';
  returnUrl: string | null = null;
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

      this.returnUrl = params.returnUrl ?? null;

      if (!params.id || !params.token || !params.expires || !params._hash) {
        this.status = 'error';
        this.message = 'Lien de vérification invalide.';
        return;
      }

      const signature = [params.id, params.token, params.expires, params._hash].join('|');
      if (this.lastSignature === signature) {
        return;
      }

      this.lastSignature = signature;
      this.status = 'loading';
      this.message = 'Vérification en cours...';

      void this.authService
        .verifyEmail({
          id: params.id,
          token: params.token,
          expires: params.expires,
          _hash: params._hash,
        })
        .then(() => {
          this.status = 'success';
          this.message = 'Votre adresse email est vérifiée.';
        })
        .catch(() => {
          this.status = 'error';
          this.message = 'Lien expiré ou invalide.';
        });
    });
  }

  get loginQueryParams(): { status?: string; returnUrl?: string } | null {
    const params: { status?: string; returnUrl?: string } = {};

    if (this.status === 'success') {
      params.status = 'verified';
    }

    if (this.returnUrl) {
      params.returnUrl = this.returnUrl;
    }

    return Object.keys(params).length > 0 ? params : null;
  }
}
