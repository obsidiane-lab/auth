import { DestroyRef, effect } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrontendConfigService } from '../../../core/services/frontend-config.service';
import { estimatePasswordStrength } from '../../../core/utils/password-strength.util';
import { matchControlValidator, passwordStrengthValidator } from './password-validators.util';

export function configurePasswordForm(
  form: FormGroup,
  configService: FrontendConfigService,
  destroyRef: DestroyRef,
  onStrengthChange: (strength: number) => void,
): void {
  effect(() => {
    const minScore = configService.config().passwordStrengthLevel;
    const passwordControl = form.get('password');
    const confirmControl = form.get('confirmPassword');

    passwordControl?.setValidators([Validators.required, passwordStrengthValidator(minScore)]);
    confirmControl?.setValidators([Validators.required, matchControlValidator('password')]);
    passwordControl?.updateValueAndValidity({ emitEvent: false });
    confirmControl?.updateValueAndValidity({ emitEvent: false });
  });

  form
    .get('password')
    ?.valueChanges.pipe(takeUntilDestroyed(destroyRef))
    .subscribe((value) => {
      const passwordValue = typeof value === 'string' ? value : '';
      onStrengthChange(estimatePasswordStrength(passwordValue));
      form.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
    });
}
