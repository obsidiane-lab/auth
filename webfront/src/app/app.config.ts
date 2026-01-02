import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { provideBridge } from 'bridge';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { resolveApiBaseUrl } from './core/api-base-url';
import { appRoutes } from './app.routes';
import { SetupStatusService } from './core/services/setup-status.service';

function initializeApp(setupStatusService: SetupStatusService) {
  return () => setupStatusService.checkSetupStatus();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withViewTransitions()),
    provideTranslateService({ defaultLanguage: 'fr' }),
    importProvidersFrom(AngularSvgIconModule.forRoot()),
    provideAnimations(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideBridge({
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [SetupStatusService],
      multi: true,
    },
  ],
};
