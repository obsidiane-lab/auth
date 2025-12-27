import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { TranslateService, type TranslationObject } from '@ngx-translate/core';
import frTranslations from '../assets/i18n/fr.json';
import enTranslations from '../assets/i18n/en.json';
import { ThemeService } from './core/services/theme.service';
import { FrontendConfigService } from './core/services/frontend-config.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RouterOutlet, NgxSonnerToaster],
})
export class AppComponent {
  constructor(
    public themeService: ThemeService,
    private readonly translate: TranslateService,
    private readonly configService: FrontendConfigService,
  ) {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setTranslation('fr', frTranslations as TranslationObject, true);
    this.translate.setTranslation('en', enTranslations as TranslationObject, true);
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');

    void this.configService.loadOnce();
  }
}
