import { Component, Input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

type FormStatusKind = 'success' | 'error' | 'info';

@Component({
  selector: 'app-form-status-message',
  templateUrl: './form-status-message.component.html',
  standalone: true,
  imports: [TranslateModule, AngularSvgIconModule],
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
    const base = 'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm animate-fade-in-up';
    const styles = this.kindStyles;
    return [base, styles.border, styles.background, styles.text].join(' ');
  }

  get descriptionClass(): string {
    return this.kindStyles.description;
  }

  get iconClass(): string {
    return this.kindStyles.icon;
  }

  get role(): string {
    return this.kind === 'error' ? 'alert' : 'status';
  }

  private get kindStyles(): { border: string; background: string; text: string; description: string; icon: string } {
    switch (this.kind) {
      case 'success':
        return {
          border: 'border-green-200 dark:border-green-500/20',
          background: 'bg-green-50 dark:bg-green-500/10',
          text: 'text-green-800 dark:text-green-200',
          description: 'text-green-700 dark:text-green-300',
          icon: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          border: 'border-red-200 dark:border-red-500/20',
          background: 'bg-red-50 dark:bg-red-500/10',
          text: 'text-red-800 dark:text-red-200',
          description: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'info':
      default:
        return {
          border: 'border-blue-200 dark:border-blue-500/20',
          background: 'bg-blue-50 dark:bg-blue-500/10',
          text: 'text-blue-800 dark:text-blue-200',
          description: 'text-blue-700 dark:text-blue-300',
          icon: 'text-blue-600 dark:text-blue-400',
        };
    }
  }
}
