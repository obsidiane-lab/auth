import type { AbstractControl, ValidatorFn } from '@angular/forms';
import { meetsPasswordPolicy } from '../../../core/utils/password-strength.util';

export function passwordStrengthValidator(minScore: number): ValidatorFn {
  return (control: AbstractControl) => {
    const value = typeof control.value === 'string' ? control.value : '';
    const valid = meetsPasswordPolicy(value, { minScore });
    return valid ? null : { weakPassword: true };
  };
}

export function matchControlValidator(matchControlName: string): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.parent) {
      return null;
    }

    const matchControl = control.parent.get(matchControlName);
    if (!matchControl) {
      return null;
    }

    return matchControl.value === control.value ? null : { mismatch: true };
  };
}
