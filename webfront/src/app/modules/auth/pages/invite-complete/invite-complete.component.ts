import { NgClass } from '@angular/common';
import { Component, DestroyRef, computed, effect, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStatusMessageComponent } from '../../../../shared/components/form-status-message/form-status-message.component';
import { FrontendConfigService } from '../../../../core/services/frontend-config.service';
import { ApiErrorService } from '../../../../core/services/api-error.service';
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
  readonly isSubmitting = signal(false);
  readonly passwordStrength = signal(0);
  passwordVisible = false;
  readonly invitedEmail = signal('');
  readonly alreadyCompleted = signal(false);
  readonly inviteExpired = signal(false);
  private readonly inviteToken = signal('');
  readonly returnUrl = signal<string | null>(null);
  readonly errorMessageKey = signal('');
  readonly successMessage = signal('');
  readonly hasToken = computed(() => this.inviteToken().trim().length > 0);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: FrontendConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly inviteCompleteForm: InviteCompleteFormType,
    private readonly apiErrorService: ApiErrorService,
  ) {
    this.form = this.inviteCompleteForm.createForm(null);

    effect(() => {
      const params = this.queryParamMap();
      this.inviteToken.set(params.get('token') ?? '');
      this.returnUrl.set(params.get('returnUrl'));

      if (this.inviteToken()) {
        void this.loadInvitePreview(this.inviteToken());
      }
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

    const inviteToken = this.inviteToken();
    if (!inviteToken) {
      this.errorMessageKey.set('auth.errors.codes.INVALID_INVITATION');
      return;
    }

    const { password, confirmPassword } = this.inviteCompleteForm.toCreatePayload(this.form);

    this.isSubmitting.set(true);

    try {
      await this.authService.inviteComplete(inviteToken, password, confirmPassword);
      this.successMessage.set('Compte activé. Vous pouvez vous connecter.');
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
        this.successMessage.set('Ce lien a déjà été utilisé. Vous pouvez vous connecter.');
      }

      if (this.inviteExpired()) {
        this.errorMessageKey.set('auth.errors.codes.INVITATION_EXPIRED');
      }
    } catch (error) {
      this.errorMessageKey.set(this.apiErrorService.handleError(error));
    }
  }

  private handleError(error: unknown): void {
    this.errorMessageKey.set(this.apiErrorService.handleError(error));
  }

  goToLogin(): void {
    const returnUrl = this.returnUrl();
    void this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : undefined });
  }
}
