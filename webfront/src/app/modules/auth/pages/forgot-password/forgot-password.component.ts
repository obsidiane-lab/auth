import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, NgIf, NgClass],
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  returnUrl: string | null = null;
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    effect(() => {
      this.returnUrl = this.queryParamMap().get('returnUrl');
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

    const { email } = this.form.value;
    this.isSubmitting = true;

    try {
      await this.authService.forgotPassword(email);
      this.successMessage = 'Si un compte existe, un email de réinitialisation a été envoyé.';
    } catch {
      this.errorMessage = 'Impossible de traiter la demande pour le moment.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
