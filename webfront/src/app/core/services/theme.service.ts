import { Injectable, effect, signal } from '@angular/core';
import { Theme } from '../models/theme.model';
import { FrontendConfigService } from './frontend-config.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public theme = signal<Theme>({ mode: 'dark', color: 'base', direction: 'ltr' });
  private hasStoredTheme = false;

  constructor(private readonly configService: FrontendConfigService) {
    this.loadTheme();
    effect(() => {
      this.setConfig();
    });

    effect(() => {
      if (this.hasStoredTheme) {
        return;
      }

      const config = this.configService.config();
      this.theme.set({
        mode: config.themeMode,
        color: config.themeColor,
        direction: config.themeDirection,
      });
    });
  }

  private loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
      this.theme.set(JSON.parse(theme));
      this.hasStoredTheme = true;
    }
  }

  private setConfig() {
    this.setLocalStorage();
    this.setThemeClass();
    this.setRTL();
  }

  public get isDark(): boolean {
    return this.theme().mode == 'dark';
  }

  private setThemeClass() {
    document.querySelector('html')!.className = this.theme().mode;
    document.querySelector('html')!.setAttribute('data-theme', this.theme().color);
  }

  private setLocalStorage() {
    localStorage.setItem('theme', JSON.stringify(this.theme()));
  }

  private setRTL() {
    document.querySelector('html')!.setAttribute('dir', this.theme().direction);
    this.setLocalStorage();
  }
}
