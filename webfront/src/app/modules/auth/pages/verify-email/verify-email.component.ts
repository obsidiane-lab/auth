import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  imports: [NgIf, RouterLink, ButtonComponent],
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = 'Vérification en cours...';
  returnUrl: string | null = null;

  constructor(private readonly route: ActivatedRoute, private readonly authApi: AuthApiService) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams as {
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

    this.authApi
      .verifyEmail({
        id: params.id,
        token: params.token,
        expires: params.expires,
        _hash: params._hash,
      })
      .subscribe({
        next: () => {
          this.status = 'success';
          this.message = 'Votre adresse email est vérifiée.';
        },
        error: () => {
          this.status = 'error';
          this.message = 'Lien expiré ou invalide.';
        },
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
