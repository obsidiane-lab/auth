import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { TranslateService, type TranslationObject } from '@ngx-translate/core';
import frTranslations from '../assets/i18n/fr.json';
import enTranslations from '../assets/i18n/en.json';
import { ThemeService } from './core/services/theme.service';
import { FrontendConfigService } from './core/services/frontend-config.service';
import { FaviconService } from './core/services/favicon.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RouterOutlet, NgxSonnerToaster],
})
export class AppComponent {
  public themeService = inject(ThemeService);
  private readonly faviconService = inject(FaviconService);
  private readonly translate = inject(TranslateService);
  private readonly configService = inject(FrontendConfigService);

  constructor() {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setTranslation('fr', frTranslations as TranslationObject, true);
    this.translate.setTranslation('en', enTranslations as TranslationObject, true);
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');

    void this.configService.loadOnce();
  }
}
