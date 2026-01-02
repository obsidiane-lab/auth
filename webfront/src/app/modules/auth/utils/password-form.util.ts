import { DestroyRef, effect } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrontendConfigService } from '../../../core/services/frontend-config.service';
import { estimatePasswordEntropy } from '../../../core/utils/password-strength.util';
import { matchControlValidator, passwordStrengthValidator } from './password-validators.util';

const DEFAULT_MIN_SCORE = 2;
const MIN_SCORE_MIN = 1;
const MIN_SCORE_MAX = 4;

const clampScore = (value: number) => Math.min(MIN_SCORE_MAX, Math.max(MIN_SCORE_MIN, Math.trunc(value)));

const resolveMinScore = (value?: number | null) => clampScore(value ?? DEFAULT_MIN_SCORE);

const resolveTargetEntropy = (minScore: number): number => {
  switch (minScore) {
    case 1:
      return 60;
    case 2:
      return 80;
    case 3:
      return 100;
    case 4:
    default:
      return 120;
  }
};

const scaleStrength = (entropy: number, minScore: number): number => {
  if (entropy <= 0) {
    return 0;
  }

  const targetEntropy = resolveTargetEntropy(minScore);
  const step = targetEntropy / 4;
  const scaled = Math.floor(entropy / step);
  return Math.min(4, Math.max(0, scaled));
};

export function configurePasswordForm(
  form: FormGroup,
  configService: FrontendConfigService,
  destroyRef: DestroyRef,
  onStrengthChange: (strength: number) => void,
): void {
  const updateStrength = (value: unknown, minScore: number) => {
    const passwordValue = typeof value === 'string' ? value : '';
    const strength = estimatePasswordEntropy(passwordValue);
    onStrengthChange(scaleStrength(strength, minScore));
    form.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
  };

  effect(() => {
    const minScore = resolveMinScore(configService.config().passwordStrengthLevel);
    const passwordControl = form.get('password');
    const confirmControl = form.get('confirmPassword');

    passwordControl?.setValidators([Validators.required, passwordStrengthValidator(minScore)]);
    confirmControl?.setValidators([Validators.required, matchControlValidator('password')]);
    passwordControl?.updateValueAndValidity({ emitEvent: false });
    confirmControl?.updateValueAndValidity({ emitEvent: false });
    updateStrength(passwordControl?.value, minScore);
  });

  form
    .get('password')
    ?.valueChanges.pipe(takeUntilDestroyed(destroyRef))
    .subscribe((value) => {
      const minScore = resolveMinScore(configService.config().passwordStrengthLevel);
      updateStrength(value, minScore);
    });
}
