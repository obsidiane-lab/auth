import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-error500',
  imports: [AngularSvgIconModule, ButtonComponent],
  templateUrl: './error500.component.html',
  styleUrl: './error500.component.css',
})
export class Error500Component {
  private router = inject(Router);

  goToHomePage() {
    this.router.navigate(['/']);
  }
}
