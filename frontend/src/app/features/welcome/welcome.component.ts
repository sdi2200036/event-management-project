import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
  standalone: true,
    imports: [RouterLink]
})
export class WelcomeComponent {
  constructor(private authService: AuthService, private router: Router) {
    // Redirect logged-in users to events page
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/events']);
    }
  }
}
