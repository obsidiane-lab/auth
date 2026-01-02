import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type SetupFormModel = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type SetupPayload = {
  email: string;
  password: string;
};

export type SetupFormControls = {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class SetupFormType
  implements EntityFormType<SetupFormModel, SetupFormControls, SetupPayload, SetupPayload, void>
{
  private readonly fb = inject(FormBuilder);

  createForm(model: SetupFormModel | null): FormGroup<SetupFormControls> {
    return this.fb.group<SetupFormControls>({
      email: this.fb.nonNullable.control(model?.email ?? '', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control(model?.password ?? '', Validators.required),
      confirmPassword: this.fb.nonNullable.control(model?.confirmPassword ?? '', Validators.required),
    });
  }

  reset(form: FormGroup<SetupFormControls>, model: SetupFormModel | null): void {
    form.reset({
      email: model?.email ?? '',
      password: model?.password ?? '',
      confirmPassword: model?.confirmPassword ?? '',
    });
  }

  toCreatePayload(form: FormGroup<SetupFormControls>): SetupPayload {
    const raw = form.getRawValue();
    return {
      email: raw.email.trim(),
      password: raw.password,
    };
  }
}
