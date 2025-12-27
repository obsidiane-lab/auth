import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { estimatePasswordStrength } from '../../../../core/utils/password-strength.util';
import { resolveRedirectTarget } from '../../../../core/utils/redirect-policy.util';
import { matchControlValidator, passwordStrengthValidator } from '../../utils/password-validators.util';
import { applyFieldErrors, REGISTER_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlreadyAuthenticatedComponent } from '../../components/already-authenticated/already-authenticated.component';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AngularSvgIconModule,
    ButtonComponent,
    NgIf,
    NgClass,
    NgFor,
    FormStatusMessageComponent,
    AlreadyAuthenticatedComponent,
  ],
})
export class SignUpComponent {
  form: FormGroup;
  submitted = false;
  isSubmitting = false;
  returnUrl: string | null = null;
  redirectTarget: string | null = null;
  passwordStrength = 0;
  passwordVisible = false;
  apiFieldErrors: Partial<Record<'email' | 'password' | 'confirmPassword', string>> = {};
  status = {
    errorMessage: '',
    successMessage: '',
  };
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });

    effect(() => {
      const queryParams = this.queryParamMap();
      this.returnUrl = this.normalizeReturnUrl(queryParams.get('returnUrl'));

      const config = this.configService.config();
      const redirectUri = queryParams.get('redirect_uri');
      this.redirectTarget = resolveRedirectTarget(
        redirectUri,
        config.frontendRedirectAllowlist,
        config.frontendDefaultRedirect,
      );

      if (!this.redirectTarget && this.returnUrl) {
        this.redirectTarget = this.returnUrl;
      }
    });

    effect(() => {
      const minScore = this.configService.config().passwordStrengthLevel;
      const passwordControl = this.form.get('password');
      const confirmControl = this.form.get('confirmPassword');

      passwordControl?.setValidators([Validators.required, passwordStrengthValidator(minScore)]);
      confirmControl?.setValidators([Validators.required, matchControlValidator('password')]);
      passwordControl?.updateValueAndValidity({ emitEvent: false });
      confirmControl?.updateValueAndValidity({ emitEvent: false });
    });

    this.form
      .get('password')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const passwordValue = typeof value === 'string' ? value : '';
        this.passwordStrength = estimatePasswordStrength(passwordValue);
        this.form.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.status.errorMessage = '';
    this.status.successMessage = '';
    this.apiFieldErrors = {};

    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.value;

    this.isSubmitting = true;
    try {
      await this.authService.register(email, password);
      this.status.successMessage =
        'Inscription réussie ! Vérifiez vos emails pour confirmer votre adresse avant de vous connecter.';
      window.setTimeout(() => {
        const queryParams: { status?: string; email?: string; returnUrl?: string } = {
          status: 'registered',
          email,
        };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 1200);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private normalizeReturnUrl(value: string | null): string | null {
    if (!value) {
      return null;
    }

    if (value.startsWith('/') && !value.startsWith('//')) {
      return value;
    }

    return null;
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as { error?: string; message?: string; details?: Record<string, string> } | null;
      const fieldApplied = applyFieldErrors(
        payload,
        REGISTER_ERROR_MESSAGES,
        { email: 'email', plainPassword: 'password' },
        (field, message) => {
          this.apiFieldErrors[field as 'email' | 'password' | 'confirmPassword'] = message;
        },
        'email',
      );
      if (!fieldApplied) {
        this.status.errorMessage =
          resolveApiErrorMessage(payload, REGISTER_ERROR_MESSAGES) ?? REGISTER_ERROR_MESSAGES['UNKNOWN'];
      }
      return;
    }

    this.status.errorMessage = REGISTER_ERROR_MESSAGES['UNKNOWN'];
  }
}
