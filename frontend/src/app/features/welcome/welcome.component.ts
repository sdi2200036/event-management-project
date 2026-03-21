import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent {
  constructor(private authService: AuthService, private router: Router) {
    // Redirect logged-in users to events page
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/events']);
    }
  }
}
