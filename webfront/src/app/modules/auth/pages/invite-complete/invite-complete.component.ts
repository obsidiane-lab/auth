import { Component, DestroyRef, computed, effect, signal, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { configurePasswordForm } from '../../utils/password-form.util';
import { InviteCompleteFormType, type InviteCompleteFormControls } from '../../forms/invite-complete.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { PasswordInputComponent } from '../../../../shared/components/password-input/password-input.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-invite-complete',
  templateUrl: './invite-complete.component.html',
  styleUrls: ['./invite-complete.component.css'],
  imports: [ReactiveFormsModule, TranslateModule, ButtonComponent, FormStatusMessageComponent, PasswordInputComponent, AngularSvgIconModule],
})
export class InviteCompleteComponent extends BaseAuthFormComponent<InviteCompleteFormControls> {
  private readonly authService = inject(AuthService);
  private readonly configService = inject(FrontendConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inviteCompleteForm = inject(InviteCompleteFormType);

  form: FormGroup<InviteCompleteFormControls>;
  readonly passwordStrength = signal(0);
  readonly invitedEmail = signal('');
  readonly alreadyCompleted = signal(false);
  readonly inviteExpired = signal(false);
  private readonly inviteToken = signal('');
  readonly hasToken = computed(() => this.inviteToken().trim().length > 0);

  constructor() {
    super();
    this.form = this.inviteCompleteForm.createForm(null);

    effect(() => {
      const params = this.queryParamMap();
      this.inviteToken.set(params.get('token') ?? '');

      if (this.inviteToken()) {
        void this.loadInvitePreview(this.inviteToken());
      }
    });

    configurePasswordForm(this.form, this.configService, this.destroyRef, (strength) => {
      this.passwordStrength.set(strength);
    });
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.resetMessages();

    if (this.form.invalid) {
      return;
    }

    const inviteToken = this.inviteToken();
    if (!inviteToken) {
      this.errorMessageKey.set('auth.errors.codes.400');
      return;
    }

    const { password, confirmPassword } = this.inviteCompleteForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.authService.inviteComplete(inviteToken, password, confirmPassword);
      this.successMessage.set(SuccessMessages.accountActivated);
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams: { status?: string; returnUrl?: string } = { status: 'invited' };
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

  private async loadInvitePreview(token: string): Promise<void> {
    try {
      const preview = await this.authService.invitePreview(token);
      this.invitedEmail.set(preview.email ?? '');
      this.alreadyCompleted.set(preview.accepted ?? false);
      this.inviteExpired.set(preview.expired ?? false);

      if (this.alreadyCompleted()) {
        this.successMessage.set(SuccessMessages.invitationAlreadyUsed);
      }

      if (this.inviteExpired()) {
        this.errorMessageKey.set('auth.errors.codes.410');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  goToLogin(): void {
    const returnUrl = this.returnUrl();
    void this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : undefined });
  }
}
