import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
  standalone: true,
  imports: [RouterLink, FormField]
})
export class LoginComponent {
  readonly loginModel = signal({
    username: '',
    password: '',
  });
  readonly loginFields = form(this.loginModel, (p) => {
    required(p.username);
    minLength(p.username, 3);
    required(p.password);
    minLength(p.password, 6);
  });
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async onSubmit(): Promise<void> {
    const isValid = await submit(this.loginFields);
    if (!isValid) return;

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginModel()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/events';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
