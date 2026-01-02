import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { ForgotPasswordFormType, type ForgotPasswordFormControls } from '../../forms/forgot-password.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ValidationMessages, SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, FormStatusMessageComponent, FormFieldComponent],
})
export class ForgotPasswordComponent extends BaseAuthFormComponent<ForgotPasswordFormControls> {
  form: FormGroup<ForgotPasswordFormControls>;
  readonly emailErrors = ValidationMessages.email();

  constructor(
    route: ActivatedRoute,
    router: Router,
    apiErrorService: ApiErrorService,
    private readonly authService: AuthService,
    private readonly forgotPasswordForm: ForgotPasswordFormType,
  ) {
    super(route, router, apiErrorService);
    this.form = this.forgotPasswordForm.createForm(null);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.resetMessages();

    if (this.form.invalid) {
      return;
    }

    const { email } = this.forgotPasswordForm.toCreatePayload(this.form);
    this.isSubmitting.set(true);

    try {
      await this.authService.forgotPassword(email);
      this.successMessage.set(SuccessMessages.resetEmailSent);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
