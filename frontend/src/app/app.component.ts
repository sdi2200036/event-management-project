import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { LoadingComponent } from './features/loading/loading.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	standalone: true,
	imports: [NavbarComponent, RouterOutlet, LoadingComponent]
})
export class AppComponent {
	title = 'EventHub';
}
