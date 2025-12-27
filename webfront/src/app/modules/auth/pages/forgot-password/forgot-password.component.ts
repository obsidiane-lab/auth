import { NgClass, NgIf } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { HttpErrorResponse } from '@angular/common/http';
import { PASSWORD_REQUEST_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';
import { ForgotPasswordFormType, type ForgotPasswordFormControls } from '../../forms/forgot-password.form';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, NgIf, NgClass, FormStatusMessageComponent],
})
export class ForgotPasswordComponent {
  form: FormGroup<ForgotPasswordFormControls>;
  submitted = false;
  isSubmitting = false;
  returnUrl: string | null = null;
  status = {
    errorMessage: '',
    successMessage: '',
  };
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly forgotPasswordForm: ForgotPasswordFormType,
  ) {
    this.form = this.forgotPasswordForm.createForm(null);

    effect(() => {
      this.returnUrl = this.queryParamMap().get('returnUrl');
    });
  }

  get f() {
    return this.form.controls;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.status.errorMessage = '';
    this.status.successMessage = '';

    if (this.form.invalid) {
      return;
    }

    const { email } = this.forgotPasswordForm.toCreatePayload(this.form);
    this.isSubmitting = true;

    try {
      await this.authService.forgotPassword(email);
      this.status.successMessage = 'Si un compte existe, un email de réinitialisation a été envoyé.';
    } catch (error) {
      this.status.errorMessage = this.resolveErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as { error?: string; message?: string } | null;
      const resolved = resolveApiErrorMessage(payload, PASSWORD_REQUEST_ERROR_MESSAGES);
      if (resolved) {
        return resolved;
      }
      if (error.status === 429) {
        return PASSWORD_REQUEST_ERROR_MESSAGES['RATE_LIMIT'];
      }
    }

    return PASSWORD_REQUEST_ERROR_MESSAGES['UNKNOWN'];
  }
}
