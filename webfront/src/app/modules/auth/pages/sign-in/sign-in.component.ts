import { Component, computed, effect, signal, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { isInternalPath, resolveRedirectTarget } from '../../../../core/utils/redirect-policy.util';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { SignInFormType, type SignInFormControls } from '../../forms/sign-in.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '../../../../shared/components/password-input/password-input.component';
import { ValidationMessages, SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    FormStatusMessageComponent,
    FormFieldComponent,
    PasswordInputComponent,
  ],
})
export class SignInComponent extends BaseAuthFormComponent<SignInFormControls> {
  private readonly authService = inject(AuthService);
  private readonly configService = inject(FrontendConfigService);
  private readonly signInForm = inject(SignInFormType);

  form: FormGroup<SignInFormControls>;
  redirectTarget: string | null = null;
  readonly canRegister = computed(() => this.configService.config().registrationEnabled);
  readonly infoMessage = signal('');
  readonly emailErrors = ValidationMessages.email();

  constructor() {
    super();
    this.form = this.signInForm.createForm(null);

    effect(() => {
      const queryParams = this.queryParamMap();
      const email = queryParams.get('email');
      if (email && !this.form.get('email')?.value) {
        this.form.patchValue({ email });
      }

      this.redirectTarget = resolveRedirectTarget(this.configService.config().frontendRedirectUrl);

      if (!this.redirectTarget && this.returnUrl()) {
        this.redirectTarget = this.returnUrl();
      }

      this.infoMessage.set(this.getStatusMessage(queryParams.get('status')));
    });
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.resetMessages();
    this.infoMessage.set('');
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.signInForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);
    try {
      await this.authService.login(email, password);
      this.successMessage.set(SuccessMessages.loginSuccess);

      window.setTimeout(() => {
        if (this.redirectTarget) {
          if (isInternalPath(this.redirectTarget)) {
            void this.router.navigateByUrl(this.redirectTarget, { replaceUrl: true });
          } else if (typeof window !== 'undefined') {
            window.location.assign(this.redirectTarget);
          }
          return;
        }

        void this.router.navigate(['/login'], { queryParams: { status: 'logged-in' }, replaceUrl: true });
      }, 1000);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getStatusMessage(status: string | null): string {
    switch (status) {
      case 'registered':
        return SuccessMessages.accountCreated;
      case 'verified':
        return SuccessMessages.emailVerified;
      case 'reset':
        return SuccessMessages.passwordUpdated;
      case 'invited':
        return SuccessMessages.invitationConfirmed;
      case 'logged-in':
        return SuccessMessages.loginSuccessClose;
      default:
        return '';
    }
  }
}
