import { NgClass, NgIf } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SetupService } from '../../../../core/services/setup.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgIf, NgClass],
})
export class SetupComponent {
  form: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  returnUrl: string | null = null;
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly setupService: SetupService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
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
      await this.setupService.createInitialAdmin(email, password);
      const queryParams: { status?: string; returnUrl?: string } = { status: 'setup' };
      if (this.returnUrl) {
        queryParams.returnUrl = this.returnUrl;
      }
      void this.router.navigate(['/login'], { queryParams, replaceUrl: true });
    } catch {
      this.errorMessage = 'Impossible de créer l’administrateur.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
