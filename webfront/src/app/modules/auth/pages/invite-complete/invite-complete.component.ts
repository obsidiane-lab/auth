import { NgClass } from '@angular/common';
import { Component, DestroyRef, effect } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { applyFieldErrors, INVITE_ERROR_MESSAGES, resolveApiErrorMessage, REGISTER_ERROR_MESSAGES } from '../../utils/auth-errors.util';
import { HttpErrorResponse } from '@angular/common/http';
import { configurePasswordForm } from '../../utils/password-form.util';
import { InviteCompleteFormType, type InviteCompleteFormControls } from '../../forms/invite-complete.form';

@Component({
  selector: 'app-invite-complete',
  templateUrl: './invite-complete.component.html',
  styleUrls: ['./invite-complete.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgClass, AngularSvgIconModule, FormStatusMessageComponent],
})
export class InviteCompleteComponent {
  form: FormGroup<InviteCompleteFormControls>;
  submitted = false;
  isSubmitting = false;
  passwordStrength = 0;
  passwordVisible = false;
  invitedEmail = '';
  alreadyCompleted = false;
  inviteExpired = false;
  private inviteToken = '';
  returnUrl: string | null = null;
  apiFieldErrors: Partial<Record<'password' | 'confirmPassword', string>> = {};
  status = {
    errorMessage: '',
    successMessage: '',
  };
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly inviteCompleteForm: InviteCompleteFormType,
  ) {
    this.form = this.inviteCompleteForm.createForm(null);

    effect(() => {
      const params = this.queryParamMap();
      this.inviteToken = params.get('token') ?? '';
      this.returnUrl = params.get('returnUrl');

      if (this.inviteToken) {
        void this.loadInvitePreview(this.inviteToken);
      }
    });

    configurePasswordForm(this.form, this.configService, this.destroyRef, (strength) => {
      this.passwordStrength = strength;
    });
  }

  get f() {
    return this.form.controls;
  }

  get hasToken(): boolean {
    return this.inviteToken.trim().length > 0;
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

    if (!this.inviteToken) {
      this.status.errorMessage = INVITE_ERROR_MESSAGES['INVALID_INVITATION'];
      return;
    }

    const { password, confirmPassword } = this.inviteCompleteForm.toCreatePayload(this.form);

    this.isSubmitting = true;

    try {
      await this.authService.inviteComplete(this.inviteToken, password, confirmPassword);
      this.status.successMessage = 'Compte activé. Vous pouvez vous connecter.';
      window.setTimeout(() => {
        const queryParams: { status?: string; returnUrl?: string } = { status: 'invited' };
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

  private async loadInvitePreview(token: string): Promise<void> {
    try {
      const preview = await this.authService.invitePreview(token);
      this.invitedEmail = preview.email ?? '';
      this.alreadyCompleted = preview.accepted ?? false;
      this.inviteExpired = preview.expired ?? false;

      if (this.alreadyCompleted) {
        this.status.successMessage = 'Ce lien a déjà été utilisé. Vous pouvez vous connecter.';
      }

      if (this.inviteExpired) {
        this.status.errorMessage = INVITE_ERROR_MESSAGES['INVITATION_EXPIRED'];
      }
    } catch {
      // Silence: on laisse la validation se faire au submit.
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const payload = (error.error ?? null) as { error?: string; message?: string; details?: Record<string, string> } | null;
      const fieldApplied = applyFieldErrors(
        payload,
        REGISTER_ERROR_MESSAGES,
        { plainPassword: 'password' },
        (field, message) => {
          this.apiFieldErrors[field as 'password' | 'confirmPassword'] = message;
        },
        'password',
      );
      if (!fieldApplied) {
        this.status.errorMessage =
          resolveApiErrorMessage(payload, INVITE_ERROR_MESSAGES) ?? INVITE_ERROR_MESSAGES['UNKNOWN'];
      }
      return;
    }

    this.status.errorMessage = INVITE_ERROR_MESSAGES['UNKNOWN'];
  }

  goToLogin(): void {
    void this.router.navigate(['/login'], { queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : undefined });
  }
}
