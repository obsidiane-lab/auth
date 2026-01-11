import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

export interface FieldError {
  key: string;
  message: string;
}

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  imports: [ReactiveFormsModule, NgClass, AngularSvgIconModule, TranslateModule],
})
export class FormFieldComponent {
  @Input() label!: string;
  @Input() inputId!: string;
  @Input() icon?: string;
  @Input() type: string = 'text';
  @Input() inputmode?: string;
  @Input() autocomplete?: string;
  @Input() control!: FormControl;
  @Input() submitted = false;
  @Input() errors: FieldError[] = [];
  @Input() placeholder = ' ';
  @Input() hasToggle = false;

  get hasErrors(): boolean {
    return this.submitted && !!this.control.errors;
  }

  getErrorMessageKey(): string {
    if (!this.hasErrors) return '';

    for (const error of this.errors) {
      if (this.control.hasError(error.key)) {
        return error.message;
      }
    }
    return '';
  }
}
