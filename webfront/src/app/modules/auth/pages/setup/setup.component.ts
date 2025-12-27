import { NgClass } from '@angular/common';
import { Component, DestroyRef, computed, effect, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SetupService } from '../../../../core/services/setup.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { applyFieldErrors, INITIAL_ADMIN_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';
import { HttpErrorResponse } from '@angular/common/http';
import { configurePasswordForm } from '../../utils/password-form.util';
import { SetupFormType, type SetupFormControls } from '../../forms/setup.form';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgClass, AngularSvgIconModule, FormStatusMessageComponent],
})
export class SetupComponent {
  form: FormGroup<SetupFormControls>;
  submitted = false;
  readonly isSubmitting = signal(false);
  readonly returnUrl = signal<string | null>(null);
  readonly passwordStrength = signal(0);
  passwordVisible = false;
  readonly brandingName = computed(() => this.configService.config().brandingName);
  readonly apiFieldErrors = signal<Partial<Record<'email' | 'password' | 'confirmPassword', string>>>({});
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly setupService: SetupService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly setupForm: SetupFormType,
  ) {
    this.form = this.setupForm.createForm(null);

    effect(() => {
      this.returnUrl.set(this.queryParamMap().get('returnUrl'));
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

    const { email, password } = this.setupForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.setupService.createInitialAdmin(email, password);
      this.successMessage.set('Administrateur créé. Vous pouvez vous connecter.');
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams: { status?: string; returnUrl?: string } = { status: 'setup' };
        if (returnUrl) {
          queryParams.returnUrl = returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 500);
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
          INITIAL_ADMIN_ERROR_MESSAGES,
          { email: 'email', plainPassword: 'password', password: 'password' },
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
          resolveApiErrorMessage(payload, INITIAL_ADMIN_ERROR_MESSAGES) ?? INITIAL_ADMIN_ERROR_MESSAGES['UNKNOWN'],
        );
      }
      return;
    }

    this.errorMessage.set(INITIAL_ADMIN_ERROR_MESSAGES['UNKNOWN']);
  }
}
