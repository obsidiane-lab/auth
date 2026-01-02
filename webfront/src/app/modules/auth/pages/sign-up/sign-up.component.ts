import { Component, DestroyRef, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { configurePasswordForm } from '../../utils/password-form.util';
import { SignUpFormType, type SignUpFormControls } from '../../forms/sign-up.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '../../../../shared/components/password-input/password-input.component';
import { ValidationMessages, SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    FormStatusMessageComponent,
    FormFieldComponent,
    PasswordInputComponent,
  ],
})
export class SignUpComponent extends BaseAuthFormComponent<SignUpFormControls> {
  form: FormGroup<SignUpFormControls>;
  readonly passwordStrength = signal(0);
  readonly emailErrors = ValidationMessages.email();

  constructor(
    route: ActivatedRoute,
    router: Router,
    apiErrorService: ApiErrorService,
    private readonly authService: AuthService,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly signUpForm: SignUpFormType,
  ) {
    super(route, router, apiErrorService);
    this.form = this.signUpForm.createForm(null);

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

    const { email, password } = this.signUpForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);
    try {
      await this.authService.register(email, password);
      this.successMessage.set(SuccessMessages.accountCreated);
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
}
