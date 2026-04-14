import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	standalone: true,
	imports: [NavbarComponent, RouterOutlet, LoadingComponent, ToastComponent]
})
export class AppComponent {}
