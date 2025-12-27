import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, effect } from '@angular/core';
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
  imports: [ReactiveFormsModule, ButtonComponent, NgIf, NgClass, NgFor, AngularSvgIconModule, FormStatusMessageComponent],
})
export class SetupComponent {
  form: FormGroup<SetupFormControls>;
  submitted = false;
  isSubmitting = false;
  returnUrl: string | null = null;
  passwordStrength = 0;
  passwordVisible = false;
  brandingName = '';
  apiFieldErrors: Partial<Record<'email' | 'password' | 'confirmPassword', string>> = {};
  status = {
    errorMessage: '',
    successMessage: '',
  };
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
      this.returnUrl = this.queryParamMap().get('returnUrl');
    });

    effect(() => {
      const config = this.configService.config();
      this.brandingName = config.brandingName;
    });

    configurePasswordForm(this.form, this.configService, this.destroyRef, (strength) => {
      this.passwordStrength = strength;
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

    const { email, password } = this.setupForm.toCreatePayload(this.form);

    this.isSubmitting = true;

    try {
      await this.setupService.createInitialAdmin(email, password);
      this.status.successMessage = 'Administrateur créé. Vous pouvez maintenant vous connecter.';
      window.setTimeout(() => {
        const queryParams: { status?: string; returnUrl?: string } = { status: 'setup' };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 500);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
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
          this.apiFieldErrors[field as 'email' | 'password' | 'confirmPassword'] = message;
        },
        'email',
      );
      if (!fieldApplied) {
        this.status.errorMessage =
          resolveApiErrorMessage(payload, INITIAL_ADMIN_ERROR_MESSAGES) ?? INITIAL_ADMIN_ERROR_MESSAGES['UNKNOWN'];
      }
      return;
    }

    this.status.errorMessage = INITIAL_ADMIN_ERROR_MESSAGES['UNKNOWN'];
  }
}
