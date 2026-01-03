import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule],
  template: `
    <div class="relative group">
      <!-- Trigger Button -->
      <button
        type="button"
        (click)="toggleMenu()"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted focus:outline-hidden transition-colors"
        aria-label="Theme Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen) {
        <div
          class="absolute right-0 top-12 z-50 w-64 origin-top-right rounded-xl border border-border bg-card p-4 shadow-xl ring-1 ring-black/5 focus:outline-hidden animate-fade-in-up"
        >
        <!-- Mode Toggle -->
        <div class="mb-4">
          <h3 class="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Mode</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              (click)="setMode('light')"
              [class.ring-2]="themeService.theme().mode === 'light'"
              class="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted ring-primary transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Light
            </button>
            <button
              (click)="setMode('dark')"
              [class.ring-2]="themeService.theme().mode === 'dark'"
              class="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted ring-primary transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark
            </button>
          </div>
        </div>

        <!-- Color Palette -->
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Color</h3>
          <div class="grid grid-cols-5 gap-2">
            @for (color of colors; track color) {
              <button
                (click)="setColor(color)"
                [title]="color"
                class="h-8 w-8 rounded-full border border-border transition-transform hover:scale-110 focus:outline-hidden ring-offset-2 ring-offset-card"
                [class.ring-2]="themeService.theme().color === color"
                [class.ring-primary]="themeService.theme().color === color"
                [style.background-color]="getColorValue(color)"
              ></button>
            }
          </div>
        </div>
        </div>
      }

      <!-- Backdrop for closing -->
      @if (isOpen) {
        <div (click)="isOpen = false" (keydown.escape)="isOpen = false" tabindex="0" role="button" aria-label="Close menu" class="fixed inset-0 z-40 bg-transparent"></div>
      }
    </div>
  `,
  styles: []
})
export class ThemeSwitcherComponent {
  themeService = inject(ThemeService);
  isOpen = false;

  colors = ['base', 'violet', 'red', 'blue', 'orange', 'yellow', 'green', 'cyan', 'rose'];

  // Mapping simple names to actual hex values for the preview dots
  // Note: These should match roughly what's in CSS, or we can use classes. 
  // For simplicity here, I'll use inline styles with hardcoded approximations or CSS variables if possible.
  // Using CSS variables is better but they depend on the *current* theme context which might be tricky for a palette.
  // I will use static colors for the preview dots to ensure they look correct regardless of current theme.
  colorMap: Record<string, string> = {
    'base': '#E11D48', // Default primary
    'violet': '#6E56CF',
    'red': '#CC0033',
    'blue': '#2490FF',
    'orange': '#EA580C',
    'yellow': '#FACC15',
    'green': '#22C55E',
    'cyan': '#06b6d4',
    'rose': '#f43f5e'
  };

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  setMode(mode: 'light' | 'dark') {
    const current = this.themeService.theme();
    this.themeService.theme.set({ ...current, mode });
  }

  setColor(color: string) {
    const current = this.themeService.theme();
    this.themeService.theme.set({ ...current, color });
  }

  getColorValue(color: string): string {
    return this.colorMap[color] || '#E11D48';
  }
}
