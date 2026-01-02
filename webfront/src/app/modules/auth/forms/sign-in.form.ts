import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInFormControls = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class SignInFormType
  implements EntityFormType<SignInPayload, SignInFormControls, SignInPayload, SignInPayload, void>
{
  private readonly fb = inject(FormBuilder);

  createForm(model: SignInPayload | null): FormGroup<SignInFormControls> {
    return this.fb.group<SignInFormControls>({
      email: this.fb.nonNullable.control(model?.email ?? '', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control(model?.password ?? '', Validators.required),
    });
  }

  reset(form: FormGroup<SignInFormControls>, model: SignInPayload | null): void {
    form.reset({
      email: model?.email ?? '',
      password: model?.password ?? '',
    });
  }

  toCreatePayload(form: FormGroup<SignInFormControls>): SignInPayload {
    const raw = form.getRawValue();
    return {
      email: raw.email.trim(),
      password: raw.password,
    };
  }
}
