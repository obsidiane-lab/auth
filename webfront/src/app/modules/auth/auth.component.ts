import { Component, effect } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FrontendConfigService } from '../../core/services/frontend-config.service';
import { AlreadyAuthenticatedComponent } from './components/already-authenticated/already-authenticated.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { normalizeInternalPath, resolveRedirectTarget } from '../../core/utils/redirect-policy.util';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [AngularSvgIconModule, RouterOutlet, AlreadyAuthenticatedComponent],
})
export class AuthComponent {
  readonly config = this.configService.config;
  redirectTarget: string | null = null;
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly configService: FrontendConfigService,
    private readonly route: ActivatedRoute,
  ) {
    effect(() => {
      const queryParams = this.queryParamMap();
      const returnUrl = normalizeInternalPath(queryParams.get('returnUrl'));
      const config = this.configService.config();
      const redirectUri = queryParams.get('redirect_uri');
      this.redirectTarget = resolveRedirectTarget(
        redirectUri,
        config.frontendRedirectAllowlist,
        config.frontendDefaultRedirect,
      );
      if (!this.redirectTarget && returnUrl) {
        this.redirectTarget = returnUrl;
      }
    });
  }
}
