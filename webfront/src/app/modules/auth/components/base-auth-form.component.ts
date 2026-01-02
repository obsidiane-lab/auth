import { Directive, effect, signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { normalizeInternalPath } from '../../../core/utils/redirect-policy.util';

@Directive()
export abstract class BaseAuthFormComponent<T extends { [K in keyof T]: AbstractControl }> {
  abstract form: FormGroup<T>;
  submitted = false;
  readonly isSubmitting = signal(false);
  readonly returnUrl = signal<string | null>(null);
  readonly errorMessageKey = signal('');
  readonly successMessage = signal('');

  protected readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  constructor(
    protected readonly route: ActivatedRoute,
    protected readonly router: Router,
    protected readonly apiErrorService: ApiErrorService,
  ) {
    this.setupReturnUrl();
  }

  get f() {
    return this.form.controls;
  }

  abstract onSubmit(): Promise<void>;

  protected setupReturnUrl(): void {
    effect(() => {
      this.returnUrl.set(normalizeInternalPath(this.queryParamMap().get('returnUrl')));
    });
  }

  protected handleError(error: unknown): void {
    this.errorMessageKey.set(this.apiErrorService.handleError(error));
  }

  protected resetMessages(): void {
    this.errorMessageKey.set('');
    this.successMessage.set('');
  }
}
