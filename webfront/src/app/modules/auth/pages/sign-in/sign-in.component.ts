import { NgClass, NgIf } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { isInternalPath, normalizeInternalPath, resolveRedirectTarget } from '../../../../core/utils/redirect-policy.util';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { AlreadyAuthenticatedComponent } from '../../components/already-authenticated/already-authenticated.component';
import { HttpErrorResponse } from '@angular/common/http';
import { SignInFormType, type SignInFormControls } from '../../forms/sign-in.form';
import { ApiErrorPayload, LOGIN_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    AngularSvgIconModule,
    NgIf,
    ButtonComponent,
    NgClass,
    FormStatusMessageComponent,
    AlreadyAuthenticatedComponent,
  ],
})
export class SignInComponent {
  form: FormGroup<SignInFormControls>;
  submitted = false;
  passwordTextType = false;
  isSubmitting = false;
  returnUrl: string | null = null;
  redirectTarget: string | null = null;
  canRegister = true;
  flashMessage = '';
  status = {
    errorMessage: '',
    successMessage: '',
    infoMessage: '',
  };
  private readonly queryParamMap = toSignal(this._route.queryParamMap, { initialValue: this._route.snapshot.queryParamMap });

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly configService: FrontendConfigService,
    private readonly signInForm: SignInFormType,
  ) {
    this.form = this.signInForm.createForm(null);

    effect(() => {
      const queryParams = this.queryParamMap();
      const email = queryParams.get('email');
      if (email && !this.form.get('email')?.value) {
        this.form.patchValue({ email });
      }

      this.returnUrl = normalizeInternalPath(queryParams.get('returnUrl'));

      const config = this.configService.config();
      this.canRegister = config.registrationEnabled;

      const redirectUri = queryParams.get('redirect_uri');
      this.redirectTarget = resolveRedirectTarget(
        redirectUri,
        config.frontendRedirectAllowlist,
        config.frontendDefaultRedirect,
      );

      if (!this.redirectTarget && this.returnUrl) {
        this.redirectTarget = this.returnUrl;
      }

      this.flashMessage = this.getStatusMessage(queryParams.get('status'));
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.status.errorMessage = '';
    this.status.successMessage = '';
    this.status.infoMessage = '';
    this.flashMessage = '';
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.signInForm.toCreatePayload(this.form);

    this.isSubmitting = true;
    try {
      await this.authService.login(email, password);
      this.status.successMessage = 'Authentification réussie. Redirection en cours...';
      window.setTimeout(() => {
        this.status.infoMessage = 'Redirection...';
      }, 350);

      window.setTimeout(() => {
        if (this.redirectTarget) {
          if (isInternalPath(this.redirectTarget)) {
            void this._router.navigateByUrl(this.redirectTarget, { replaceUrl: true });
          } else if (typeof window !== 'undefined') {
            window.location.assign(this.redirectTarget);
          }
          return;
        }

        void this._router.navigate(['/login'], { queryParams: { status: 'logged-in' }, replaceUrl: true });
      }, 1000);
    } catch (error) {
      this.status.errorMessage = this.resolveErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private getStatusMessage(status: string | null): string {
    switch (status) {
      case 'registered':
        return 'Compte créé. Vérifiez votre email pour activer l’accès.';
      case 'verified':
        return 'Email vérifié. Vous pouvez vous connecter.';
      case 'reset':
        return 'Mot de passe mis à jour. Connectez-vous.';
      case 'invited':
        return 'Invitation confirmée. Vous pouvez vous connecter.';
      case 'setup':
        return 'Administrateur créé. Connectez-vous.';
      case 'logged-in':
        return 'Connexion réussie. Vous pouvez fermer cette fenêtre.';
      default:
        return '';
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as ApiErrorPayload | null;
      const resolved = resolveApiErrorMessage(payload, LOGIN_ERROR_MESSAGES);
      if (resolved) {
        return resolved;
      }

      if (error.status === 401) {
        return LOGIN_ERROR_MESSAGES['INVALID_CREDENTIALS'];
      }
      if (error.status === 429) {
        return LOGIN_ERROR_MESSAGES['RATE_LIMIT'];
      }
    }

    return LOGIN_ERROR_MESSAGES['UNKNOWN'];
  }
}
