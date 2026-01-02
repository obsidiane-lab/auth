import { NgClass } from '@angular/common';
import { Component, DestroyRef, computed, effect, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SetupService } from '../../../../core/services/setup.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { configurePasswordForm } from '../../utils/password-form.util';
import { SetupFormType, type SetupFormControls } from '../../forms/setup.form';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgClass, AngularSvgIconModule, FormStatusMessageComponent],
})
export class SetupComponent {
  form: FormGroup<SetupFormControls>;
  submitted = false;
  readonly isSubmitting = signal(false);
  readonly returnUrl = signal<string | null>(null);
  readonly passwordStrength = signal(0);
  passwordVisible = false;
  readonly brandingName = computed(() => this.configService.config().brandingName);
  readonly errorMessageKey = signal('');
  readonly successMessage = signal('');
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly setupService: SetupService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly setupForm: SetupFormType,
    private readonly apiErrorService: ApiErrorService,
  ) {
    this.form = this.setupForm.createForm(null);

    effect(() => {
      this.returnUrl.set(this.queryParamMap().get('returnUrl'));
    });

    configurePasswordForm(this.form, this.configService, this.destroyRef, (strength) => {
      this.passwordStrength.set(strength);
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessageKey.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.setupForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.setupService.createInitialAdmin(email, password);
      this.successMessage.set('Administrateur créé. Vous pouvez vous connecter.');
      window.setTimeout(() => {
        const returnUrl = this.returnUrl();
        const queryParams: { status?: string; returnUrl?: string } = { status: 'setup' };
        if (returnUrl) {
          queryParams.returnUrl = returnUrl;
        }
        void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      }, 500);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private handleError(error: unknown): void {
    this.errorMessageKey.set(this.apiErrorService.handleError(error));
  }
}
