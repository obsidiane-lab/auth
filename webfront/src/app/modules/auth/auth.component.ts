import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FrontendConfigService } from '../../core/services/frontend-config.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [AngularSvgIconModule, RouterOutlet],
})
export class AuthComponent {
  readonly config = this.configService.config;

  constructor(private readonly configService: FrontendConfigService) {}
}
