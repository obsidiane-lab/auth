import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

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
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
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

    if (this.form.invalid) {
      return;
    }

    const { email, password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;
    try {
      await this.authService.register(email, password);
      const queryParams: { status?: string; email?: string; returnUrl?: string } = {
        status: 'registered',
        email,
      };
      if (this.returnUrl) {
        queryParams.returnUrl = this.returnUrl;
      }
      void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
    } catch {
      this.errorMessage = 'Inscription impossible. Vérifiez les informations.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
