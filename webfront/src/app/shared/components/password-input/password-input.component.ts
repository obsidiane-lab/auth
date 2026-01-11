import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-password-input',
  templateUrl: './password-input.component.html',
  imports: [ReactiveFormsModule, NgClass, AngularSvgIconModule, TranslateModule],
})
export class PasswordInputComponent {
  @Input() label = 'Mot de passe';
  @Input() inputId!: string;
  @Input() autocomplete = 'current-password';
  @Input() control!: FormControl;
  @Input() submitted = false;
  @Input() showStrengthMeter = false;
  @Input() strength = 0;
  @Input() showHelper = false;
  @Input() disabled = false;

  passwordVisible = false;

  get hasErrors(): boolean {
    return this.submitted && !!this.control.errors;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  getStrengthColor(index: number): string {
    const strength = this.strength;
    if (strength < index) return 'bg-muted';

    switch (strength) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-primary';
    }
  }
}
