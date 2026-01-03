import { Component, DestroyRef, computed, signal, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SetupService } from '../../../../core/services/setup.service';
import { SetupStatusService } from '../../../../core/services/setup-status.service';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
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
  private readonly setupService = inject(SetupService);
  private readonly setupStatusService = inject(SetupStatusService);
  private readonly configService = inject(FrontendConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly setupForm = inject(SetupFormType);

  form: FormGroup<SetupFormControls>;
  readonly passwordStrength = signal(0);
  readonly brandingName = computed(() => this.configService.config().brandingName);
  readonly emailErrors = ValidationMessages.email();

  constructor() {
    super();
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
