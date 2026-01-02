import { Injectable, effect, signal } from '@angular/core';
import { Theme } from '../models/theme.model';
import { FrontendConfigService } from './frontend-config.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public theme = signal<Theme>({ mode: 'dark', color: 'base' });
  private hasStoredTheme = false;
  private hasLoadedStoredTheme = false;

  constructor(private readonly configService: FrontendConfigService) {
    effect(() => {
      const isDev = this.isDevEnvironment();
      if (isDev && !this.hasLoadedStoredTheme) {
        this.loadTheme();
        this.hasLoadedStoredTheme = true;
      }
      if (!isDev) {
        this.hasStoredTheme = false;
        this.hasLoadedStoredTheme = false;
      }
    });

    effect(() => {
      const config = this.configService.config();
      if (this.isDevEnvironment() && this.hasStoredTheme) {
        return;
      }
      this.theme.set({
        mode: config.themeMode ?? 'dark',
        color: config.themeColor ?? 'base',
      });
    });

    effect(() => {
      this.applyTheme();
    });
  }

  private isDevEnvironment(): boolean {
    return (this.configService.config().environment ?? 'prod') === 'dev';
  }

  private loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
      this.theme.set(JSON.parse(theme));
      this.hasStoredTheme = true;
    }
  }

  private applyTheme() {
    this.setThemeClass();
    if (this.isDevEnvironment()) {
      this.setLocalStorage();
    }
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
}
