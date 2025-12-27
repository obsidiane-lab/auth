import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type NewPasswordFormModel = {
  password?: string;
  confirmPassword?: string;
};

export type NewPasswordPayload = {
  password: string;
};

export type NewPasswordFormControls = {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class NewPasswordFormType implements EntityFormType<NewPasswordFormModel, NewPasswordFormControls, NewPasswordPayload, NewPasswordPayload, void> {
  private readonly fb = inject(FormBuilder);

  createForm(model: NewPasswordFormModel | null): FormGroup<NewPasswordFormControls> {
    return this.fb.group<NewPasswordFormControls>({
      password: this.fb.nonNullable.control(model?.password ?? '', Validators.required),
      confirmPassword: this.fb.nonNullable.control(model?.confirmPassword ?? '', Validators.required),
    });
  }

  reset(form: FormGroup<NewPasswordFormControls>, model: NewPasswordFormModel | null): void {
    form.reset({
      password: model?.password ?? '',
      confirmPassword: model?.confirmPassword ?? '',
    });
  }

  toCreatePayload(form: FormGroup<NewPasswordFormControls>): NewPasswordPayload {
    const raw = form.getRawValue();
    return { password: raw.password };
  }

  toPatchPayload(form: FormGroup<NewPasswordFormControls>): NewPasswordPayload {
    return this.toCreatePayload(form);
  }
}
