import { Component, Input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type FormStatusKind = 'success' | 'error' | 'info';

@Component({
  selector: 'app-form-status-message',
  templateUrl: './form-status-message.component.html',
  standalone: true,
  imports: [TranslateModule],
})
export class FormStatusMessageComponent {
  @Input() kind: FormStatusKind = 'info';
  @Input() messageKey?: string;
  @Input() message?: string;
  @Input() descriptionKey?: string;

  constructor(private readonly translate: TranslateService) {}

  get resolvedMessage(): string {
    if (this.messageKey) {
      return this.translate.instant(this.messageKey);
    }
    return this.message?.trim() ?? '';
  }

  get resolvedDescription(): string {
    if (this.descriptionKey) {
      return this.translate.instant(this.descriptionKey);
    }
    return '';
  }

  get containerClass(): string {
    const base = 'rounded-lg border px-4 py-3 text-sm';
    const styles = this.kindStyles;
    return [base, styles.border, styles.background, styles.text].join(' ');
  }

  get descriptionClass(): string {
    return this.kindStyles.description;
  }

  get role(): string {
    return this.kind === 'error' ? 'alert' : 'status';
  }

  private get kindStyles(): { border: string; background: string; text: string; description: string } {
    switch (this.kind) {
      case 'success':
        return {
          border: 'border-emerald-400',
          background: 'bg-emerald-50',
          text: 'text-emerald-900',
          description: 'text-emerald-700',
        };
      case 'error':
        return {
          border: 'border-destructive/40',
          background: 'bg-destructive/10',
          text: 'text-destructive',
          description: 'text-destructive',
        };
      case 'info':
      default:
        return {
          border: 'border-primary/40',
          background: 'bg-primary/10',
          text: 'text-primary',
          description: 'text-primary/80',
        };
    }
  }
}
