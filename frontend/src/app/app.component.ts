import { Component } from '@angular/core';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
  standalone: true,
    imports: [NavbarComponent, RouterOutlet]
})
export class AppComponent {
  title = 'EventHub';
}
