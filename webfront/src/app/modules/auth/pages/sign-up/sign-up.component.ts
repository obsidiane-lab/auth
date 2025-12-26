import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  imports: [ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgIf, NgClass],
})
export class SignUpComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  returnUrl: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      return;
    }

    const { email, password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;

    this.authApi.register(email, password).subscribe({
      next: () => {
        const queryParams: { status?: string; email?: string; returnUrl?: string } = {
          status: 'registered',
          email,
        };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      },
      error: () => {
        this.errorMessage = 'Inscription impossible. Vérifiez les informations.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
