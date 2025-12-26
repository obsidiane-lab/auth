import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  imports: [ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgIf, NgClass],
})
export class NewPasswordComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  private resetToken = '';
  returnUrl: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });

    this.route.queryParamMap.subscribe((params) => {
      this.resetToken = params.get('token') ?? '';
      this.returnUrl = params.get('returnUrl');
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      return;
    }

    if (!this.resetToken) {
      this.errorMessage = 'Jeton de réinitialisation manquant.';
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;

    this.authApi.resetPassword(this.resetToken, password).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe mis à jour. Vous pouvez vous connecter.';
        const queryParams: { status?: string; returnUrl?: string } = { status: 'reset' };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      },
      error: () => {
        this.errorMessage = 'Impossible de mettre à jour le mot de passe.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
