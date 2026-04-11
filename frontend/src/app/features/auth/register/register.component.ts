import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { FormField, email, form, maxLength, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
  standalone: true,
  imports: [FormField, RouterLink]
})
export class RegisterComponent {
  readonly registerModel = signal({
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    afm: '',
    role: 'participant' as 'participant' | 'organizer',
  });
  readonly registerForm = form(this.registerModel, (p) => {
    required(p.username);
    minLength(p.username, 3);
    maxLength(p.username, 50);

    required(p.password);
    minLength(p.password, 6);

    required(p.confirmPassword);

    required(p.first_name);
    required(p.last_name);
    required(p.email);
    email(p.email);

    minLength(p.afm, 9);
    maxLength(p.afm, 9);
    required(p.role);
  });
  error: string = '';
  success: string = '';
  loading: boolean = false;
  passwordMismatch = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    const isValid = await submit(this.registerForm);
    if (!isValid) return;

    this.passwordMismatch = this.registerModel().password !== this.registerModel().confirmPassword;
    if (this.passwordMismatch) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.registerModel()).subscribe({
      next: (res) => {
        this.success = res.message;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
