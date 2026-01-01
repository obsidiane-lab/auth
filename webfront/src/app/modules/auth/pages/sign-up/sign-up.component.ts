import { NgClass } from '@angular/common';
import { Component, DestroyRef, effect, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { normalizeInternalPath } from '../../../../core/utils/redirect-policy.util';
import { applyFieldErrors, REGISTER_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';
import { HttpErrorResponse } from '@angular/common/http';
import { configurePasswordForm } from '../../utils/password-form.util';
import { SignUpFormType, type SignUpFormControls } from '../../forms/sign-up.form';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AngularSvgIconModule,
    ButtonComponent,
    NgClass,
    FormStatusMessageComponent,
  ],
})
export class SignUpComponent {
  form: FormGroup<SignUpFormControls>;
  submitted = false;
  readonly isSubmitting = signal(false);
  readonly returnUrl = signal<string | null>(null);
  readonly passwordStrength = signal(0);
  passwordVisible = false;
  readonly apiFieldErrors = signal<Partial<Record<'email' | 'password' | 'confirmPassword', string>>>({});
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly signUpForm: SignUpFormType,
  ) {
    this.form = this.signUpForm.createForm(null);

    effect(() => {
      const queryParams = this.queryParamMap();
      this.returnUrl.set(normalizeInternalPath(queryParams.get('returnUrl')));
    });

    configurePasswordForm(this.form, this.configService, this.destroyRef, (strength) => {
      this.passwordStrength.set(strength);
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
    this.errorMessage.set('');
    this.successMessage.set('');
    this.apiFieldErrors.set({});

    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.signUpForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);
    try {
      await this.authService.register(email, password);
      this.successMessage.set('Compte créé. Vérifiez votre email pour activer l’accès.');
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams: { status?: string; email?: string; returnUrl?: string } = {
          status: 'registered',
          email,
        };
        if (returnUrl) {
          queryParams.returnUrl = returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 1200);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as { error?: string; message?: string; details?: Record<string, string> } | null;
      const fieldApplied = applyFieldErrors(
        payload,
        REGISTER_ERROR_MESSAGES,
        { email: 'email', plainPassword: 'password' },
        (field, message) => {
          this.apiFieldErrors.update((current) => ({
            ...current,
            [field as 'email' | 'password' | 'confirmPassword']: message,
          }));
        },
        'email',
      );
      if (!fieldApplied) {
        this.errorMessage.set(
          resolveApiErrorMessage(payload, REGISTER_ERROR_MESSAGES) ?? REGISTER_ERROR_MESSAGES['UNKNOWN']
        );
      }
      return;
    }

    this.errorMessage.set(REGISTER_ERROR_MESSAGES['UNKNOWN']);
  }
}
