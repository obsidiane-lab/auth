import { NgClass, NgIf } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-invite-complete',
  templateUrl: './invite-complete.component.html',
  styleUrls: ['./invite-complete.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgIf, NgClass],
})
export class InviteCompleteComponent {
  form: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  private inviteToken = '';
  returnUrl: string | null = null;
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.form = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });

    effect(() => {
      const params = this.queryParamMap();
      this.inviteToken = params.get('token') ?? '';
      this.returnUrl = params.get('returnUrl');
    });
  }

  get f() {
    return this.form.controls;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      return;
    }

    if (!this.inviteToken) {
      this.errorMessage = 'Jeton d’invitation manquant.';
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.authService.inviteComplete(this.inviteToken, password, confirmPassword);
      this.successMessage = 'Invitation confirmée. Vous pouvez vous connecter.';
      const queryParams: { status?: string; returnUrl?: string } = { status: 'invited' };
      if (this.returnUrl) {
        queryParams.returnUrl = this.returnUrl;
      }
      void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
    } catch {
      this.errorMessage = 'Impossible de finaliser l’invitation.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
