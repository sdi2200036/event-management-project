import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
  standalone: true,
    imports: []
})
export class WelcomeComponent {
  constructor(private authService: AuthService, private router: Router) {
    // Redirect logged-in users to events page
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/events']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }
}
