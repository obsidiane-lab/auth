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
import { HttpErrorResponse } from '@angular/common/http';
import { PASSWORD_RESET_ERROR_MESSAGES, resolveApiErrorMessage } from '../../utils/auth-errors.util';
import { configurePasswordForm } from '../../utils/password-form.util';
import { NewPasswordFormType, type NewPasswordFormControls } from '../../forms/new-password.form';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AngularSvgIconModule,
    ButtonComponent,
    NgClass,
    FormStatusMessageComponent,
  ],
})
export class NewPasswordComponent {
  form: FormGroup<NewPasswordFormControls>;
  submitted = false;
  readonly isSubmitting = signal(false);
  passwordStrength = 0;
  passwordVisible = false;
  confirmVisible = false;
  status = {
    errorMessage: '',
    successMessage: '',
  };
  private resetToken = '';
  returnUrl: string | null = null;
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly newPasswordForm: NewPasswordFormType,
  ) {
    this.form = this.newPasswordForm.createForm(null);

    effect(() => {
      const params = this.queryParamMap();
      this.resetToken = params.get('token') ?? '';
      this.returnUrl = params.get('returnUrl');
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

  toggleConfirmVisibility(): void {
    this.confirmVisible = !this.confirmVisible;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.status.errorMessage = '';
    this.status.successMessage = '';

    if (this.form.invalid) {
      return;
    }

    if (!this.resetToken) {
      this.status.errorMessage = PASSWORD_RESET_ERROR_MESSAGES['INVALID_TOKEN'];
      return;
    }

    const { password } = this.newPasswordForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.authService.resetPassword(this.resetToken, password);
      this.status.successMessage = 'Mot de passe mis à jour. Vous pouvez vous connecter.';
      window.setTimeout(() => {
        const queryParams: { status?: string; returnUrl?: string } = { status: 'reset' };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 800);
    } catch (error) {
      this.status.errorMessage = this.resolveErrorMessage(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  get hasToken(): boolean {
    return this.resetToken.trim().length > 0;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as { error?: string; message?: string } | null;
      const resolved = resolveApiErrorMessage(payload, PASSWORD_RESET_ERROR_MESSAGES);
      if (resolved) {
        return resolved;
      }
    }

    return PASSWORD_RESET_ERROR_MESSAGES['UNKNOWN'];
  }
}
