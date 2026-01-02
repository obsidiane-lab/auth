import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FrontendConfigService } from '../../core/services/frontend-config.service';
import { AlreadyAuthenticatedComponent } from './components/already-authenticated/already-authenticated.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { normalizeInternalPath, resolveRedirectTarget } from '../../core/utils/redirect-policy.util';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [AngularSvgIconModule, RouterOutlet, AlreadyAuthenticatedComponent, ThemeSwitcherComponent],
})
export class AuthComponent {
  readonly config = this.configService.config;
  readonly showThemeSwitcher = computed(() => this.configService.config().environment === 'dev');
  readonly redirectTarget = signal<string | null>(null);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor(
    private readonly configService: FrontendConfigService,
    private readonly route: ActivatedRoute,
  ) {
    effect(() => {
      const queryParams = this.queryParamMap();
      const returnUrl = normalizeInternalPath(queryParams.get('returnUrl'));
      const config = this.configService.config();
      this.redirectTarget.set(
        resolveRedirectTarget(config.frontendRedirectUrl),
      );
      if (!this.redirectTarget() && returnUrl) {
        this.redirectTarget.set(returnUrl);
      }
    });
  }
}
