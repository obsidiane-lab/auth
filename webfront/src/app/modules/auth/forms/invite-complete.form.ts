import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import type { EntityFormType } from '../../../core/forms/entity-form.type';

export type InviteCompleteFormModel = {
  password?: string;
  confirmPassword?: string;
};

export type InviteCompletePayload = {
  password: string;
  confirmPassword: string;
};

export type InviteCompleteFormControls = {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
};

@Injectable({ providedIn: 'root' })
export class InviteCompleteFormType
  implements
    EntityFormType<InviteCompleteFormModel, InviteCompleteFormControls, InviteCompletePayload, InviteCompletePayload, void>
{
  private readonly fb = inject(FormBuilder);

  createForm(model: InviteCompleteFormModel | null): FormGroup<InviteCompleteFormControls> {
    return this.fb.group<InviteCompleteFormControls>({
      password: this.fb.nonNullable.control(model?.password ?? '', Validators.required),
      confirmPassword: this.fb.nonNullable.control(model?.confirmPassword ?? '', Validators.required),
    });
  }

  reset(form: FormGroup<InviteCompleteFormControls>, model: InviteCompleteFormModel | null): void {
    form.reset({
      password: model?.password ?? '',
      confirmPassword: model?.confirmPassword ?? '',
    });
  }

  toCreatePayload(form: FormGroup<InviteCompleteFormControls>): InviteCompletePayload {
    const raw = form.getRawValue();
    return {
      password: raw.password,
      confirmPassword: raw.confirmPassword,
    };
  }

  toPatchPayload(form: FormGroup<InviteCompleteFormControls>): InviteCompletePayload {
    return this.toCreatePayload(form);
  }
}
