import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { provideBridge } from 'bridge';
import { environment } from '../environments/environment';
import { resolveApiBaseUrl } from './core/api-base-url';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideTranslateService({ defaultLanguage: 'fr' }),
    importProvidersFrom(AngularSvgIconModule.forRoot()),
    provideAnimations(),
    provideZonelessChangeDetection(),
    provideBridge({
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    }),
  ],
};
