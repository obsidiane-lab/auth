import { Component, DestroyRef, computed, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SetupService } from '../../../../core/services/setup.service';
import { SetupStatusService } from '../../../../core/services/setup-status.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { configurePasswordForm } from '../../utils/password-form.util';
import { SetupFormType, type SetupFormControls } from '../../forms/setup.form';
import { BaseAuthFormComponent } from '../../components/base-auth-form.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '../../../../shared/components/password-input/password-input.component';
import { ValidationMessages, SuccessMessages } from '../../../../shared/utils/validation-messages';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  imports: [ReactiveFormsModule, TranslateModule, ButtonComponent, FormStatusMessageComponent, FormFieldComponent, PasswordInputComponent],
})
export class SetupComponent extends BaseAuthFormComponent<SetupFormControls> {
  form: FormGroup<SetupFormControls>;
  readonly passwordStrength = signal(0);
  readonly brandingName = computed(() => this.configService.config().brandingName);
  readonly emailErrors = ValidationMessages.email();

  constructor(
    route: ActivatedRoute,
    router: Router,
    apiErrorService: ApiErrorService,
    private readonly setupService: SetupService,
    private readonly setupStatusService: SetupStatusService,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly setupForm: SetupFormType,
  ) {
    super(route, router, apiErrorService);
    this.form = this.setupForm.createForm(null);

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

    const { email, password } = this.setupForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.setupService.createInitialAdmin(email, password);
      this.setupStatusService.markSetupComplete();
      this.successMessage.set(SuccessMessages.adminCreated);
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams = returnUrl ? { returnUrl } : undefined;
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 500);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
