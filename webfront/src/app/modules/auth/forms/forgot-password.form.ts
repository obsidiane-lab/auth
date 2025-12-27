import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordFormControls = {
  email: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class ForgotPasswordFormType
  implements EntityFormType<ForgotPasswordPayload, ForgotPasswordFormControls, ForgotPasswordPayload, ForgotPasswordPayload, void>
{
  private readonly fb = inject(FormBuilder);

  createForm(model: ForgotPasswordPayload | null): FormGroup<ForgotPasswordFormControls> {
    return this.fb.group<ForgotPasswordFormControls>({
      email: this.fb.nonNullable.control(model?.email ?? '', [Validators.required, Validators.email]),
    });
  }

  reset(form: FormGroup<ForgotPasswordFormControls>, model: ForgotPasswordPayload | null): void {
    form.reset({
      email: model?.email ?? '',
    });
  }

  toCreatePayload(form: FormGroup<ForgotPasswordFormControls>): ForgotPasswordPayload {
    const raw = form.getRawValue();
    return { email: raw.email.trim() };
  }

  toPatchPayload(form: FormGroup<ForgotPasswordFormControls>): ForgotPasswordPayload {
    return this.toCreatePayload(form);
  }
}
