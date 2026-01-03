import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type SignUpFormModel = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
};

export type SignUpFormControls = {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class SignUpFormType
  implements EntityFormType<SignUpFormModel, SignUpFormControls, SignUpPayload, SignUpPayload, void>
{
  private readonly fb = inject(FormBuilder);

  createForm(model: SignUpFormModel | null): FormGroup<SignUpFormControls> {
    return this.fb.group<SignUpFormControls>({
      email: this.fb.nonNullable.control(model?.email ?? '', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control(model?.password ?? '', Validators.required),
      confirmPassword: this.fb.nonNullable.control(model?.confirmPassword ?? '', Validators.required),
    });
  }

  reset(form: FormGroup<SignUpFormControls>, model: SignUpFormModel | null): void {
    form.reset({
      email: model?.email ?? '',
      password: model?.password ?? '',
      confirmPassword: model?.confirmPassword ?? '',
    });
  }

  toCreatePayload(form: FormGroup<SignUpFormControls>): SignUpPayload {
    const raw = form.getRawValue();
    return {
      email: raw.email.trim(),
      password: raw.password,
    };
  }
}
