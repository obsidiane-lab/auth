import type { AbstractControl, FormGroup } from '@angular/forms';

export interface EntityFormType<
  Model,
  Controls extends { [K in keyof Controls]: AbstractControl<unknown, unknown, unknown> },
  CreatePayload,
  PatchPayload,
  Options = void,
> {
  createForm(model: Model | null, options?: Options): FormGroup<Controls>;
  reset(form: FormGroup<Controls>, model: Model | null, options?: Options): void;
  toCreatePayload(form: FormGroup<Controls>, options?: Options): CreatePayload;
  toPatchPayload?(form: FormGroup<Controls>, base: Model, options?: Options): PatchPayload;
}

export interface ToggleRequiredFormType<Controls extends { [K in keyof Controls]: AbstractControl<unknown, unknown, unknown> }> {
  setRequired(form: FormGroup<Controls>, enabled: boolean): void;
}
