import { Component, DestroyRef, computed, effect, signal, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { configurePasswordForm } from '../../utils/password-form.util';
import { NewPasswordFormType, type NewPasswordFormControls } from '../../forms/new-password.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { PasswordInputComponent } from '../../../../shared/components/password-input/password-input.component';
import { SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    FormStatusMessageComponent,
    PasswordInputComponent,
  ],
})
export class NewPasswordComponent extends BaseAuthFormComponent<NewPasswordFormControls> {
  private readonly authService = inject(AuthService);
  private readonly configService = inject(FrontendConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly newPasswordForm = inject(NewPasswordFormType);

  form: FormGroup<NewPasswordFormControls>;
  readonly passwordStrength = signal(0);
  private readonly resetToken = signal('');
  readonly hasToken = computed(() => this.resetToken().trim().length > 0);

  constructor() {
    super();
    this.form = this.newPasswordForm.createForm(null);

    effect(() => {
      const params = this.queryParamMap();
      this.resetToken.set(params.get('token') ?? '');
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

    if (!this.hasToken()) {
      this.errorMessageKey.set('auth.errors.codes.410');
      return;
    }

    const { password } = this.newPasswordForm.toCreatePayload(this.form);
    const token = this.resetToken();

    this.isSubmitting.set(true);

    try {
      await this.authService.resetPassword(token, password);
      this.successMessage.set(SuccessMessages.passwordUpdated);
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams: { status?: string; returnUrl?: string } = { status: 'reset' };
        if (returnUrl) {
          queryParams.returnUrl = returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 800);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
