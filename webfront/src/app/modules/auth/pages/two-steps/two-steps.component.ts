import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-two-steps',
  templateUrl: './two-steps.component.html',
  styleUrls: ['./two-steps.component.css'],
  imports: [FormsModule, ButtonComponent],
})
export class TwoStepsComponent {
  public inputs = Array(6);
}
