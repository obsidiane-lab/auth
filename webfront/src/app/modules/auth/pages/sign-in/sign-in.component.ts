import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AngularSvgIconModule, NgIf, ButtonComponent, NgClass],
})
export class SignInComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  passwordTextType!: boolean;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  returnUrl: string | null = null;
  private readonly queryParamMap = toSignal(this._route.queryParamMap, { initialValue: this._route.snapshot.queryParamMap });

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    effect(() => {
      const queryParams = this.queryParamMap();
      const email = queryParams.get('email');
      if (email && !this.form.get('email')?.value) {
        this.form.patchValue({ email });
      }
      this.returnUrl = this.normalizeReturnUrl(queryParams.get('returnUrl'));
      this.successMessage = this.getStatusMessage(queryParams.get('status'));
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { email, password } = this.form.value;

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    try {
      await this.authService.login(email, password);
      if (this.returnUrl) {
        void this._router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        return;
      }
      void this._router.navigate(['/login'], { queryParams: { status: 'logged-in' }, replaceUrl: true });
    } catch {
      this.errorMessage = 'Identifiants invalides ou accès refusé.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private normalizeReturnUrl(value: string | null): string | null {
    if (!value) {
      return null;
    }

    if (value.startsWith('/') && !value.startsWith('//')) {
      return value;
    }

    return null;
  }

  private getStatusMessage(status: string | null): string {
    switch (status) {
      case 'registered':
        return 'Compte créé. Vérifiez votre email pour activer l’accès.';
      case 'verified':
        return 'Email vérifié. Vous pouvez vous connecter.';
      case 'reset':
        return 'Mot de passe mis à jour. Connectez-vous.';
      case 'invited':
        return 'Invitation confirmée. Vous pouvez vous connecter.';
      case 'setup':
        return 'Administrateur créé. Connectez-vous.';
      case 'logged-in':
        return 'Connexion réussie. Vous pouvez fermer cette fenêtre.';
      default:
        return '';
    }
  }
}
