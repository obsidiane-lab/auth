import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

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
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });

    effect(() => {
      const params = this.queryParamMap();
      this.resetToken = params.get('token') ?? '';
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

    try {
      await this.authService.resetPassword(this.resetToken, password);
      this.successMessage = 'Mot de passe mis à jour. Vous pouvez vous connecter.';
      const queryParams: { status?: string; returnUrl?: string } = { status: 'reset' };
      if (this.returnUrl) {
        queryParams.returnUrl = this.returnUrl;
      }
      void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
    } catch {
      this.errorMessage = 'Impossible de mettre à jour le mot de passe.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
