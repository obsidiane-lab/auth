import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthApiService } from '../../../../core/services/auth-api.service';

@Component({
  selector: 'app-invite-complete',
  templateUrl: './invite-complete.component.html',
  styleUrls: ['./invite-complete.component.css'],
  imports: [ReactiveFormsModule, ButtonComponent, NgIf, NgClass],
})
export class InviteCompleteComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  private inviteToken = '';
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
      this.inviteToken = params.get('token') ?? '';
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

    this.authApi.inviteComplete(this.inviteToken, password, confirmPassword).subscribe({
      next: () => {
        this.successMessage = 'Invitation confirmée. Vous pouvez vous connecter.';
        const queryParams: { status?: string; returnUrl?: string } = { status: 'invited' };
        if (this.returnUrl) {
          queryParams.returnUrl = this.returnUrl;
        }
        this.router.navigate(['/login'], { queryParams, replaceUrl: true });
      },
      error: () => {
        this.errorMessage = 'Impossible de finaliser l’invitation.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
