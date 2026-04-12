import { Component, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { FieldState, FormField, email, form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';
import { RegisterUserRole } from 'src/app/shared/models/user.model';

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
    role: RegisterUserRole.Participant,
  });
  readonly registerForm = form(this.registerModel, (p) => {
    required(p.username, { message: 'Username is required' });
    minLength(p.username, 3, { message: 'Username must be at least 3 characters' });
    maxLength(p.username, 50, { message: 'Username must be at most 50 characters' });

    required(p.password, { message: 'Password is required' });
    minLength(p.password, 6, { message: 'Password must be at least 6 characters' });

    required(p.confirmPassword);

    required(p.first_name, { message: 'First name is required' });
    required(p.last_name, { message: 'Last name is required' });
    required(p.email, { message: 'Email is required' });
    email(p.email, { message: 'Invalid email format' });

    minLength(p.afm, 9, { message: 'AFM must be 9 characters' });
    maxLength(p.afm, 9, { message: 'AFM must be 9 characters' });
    required(p.role, { message: 'Role is required' });
  });
  successMessage: WritableSignal<string> = signal('');
  isLoading: WritableSignal<boolean> = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.registerForm, async (form) => {
      if (this.registerModel().password !== this.registerModel().confirmPassword) {
        return [{
          kind: 'validation',
          field: 'form',
          message: 'Passwords do not match.'
        }];
      }

      this.isLoading.set(true);
      this.successMessage.set('');

      return await firstValueFrom(this.authService.register(this.registerModel()).pipe(
        switchMap((res) => {
          this.successMessage.set(res.message);
          this.isLoading.set(false);
          setTimeout(() => this.router.navigate(['/login']), 2000);
          return of(undefined);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return of([{
            kind: 'server',
            field: 'form',
            message: err.error?.message || 'Registration failed. Please try again.'
          }])
        })
      ));
    });
    
  }

  protected isFieldInvalid(field: FieldState<any>): boolean {
    return field.touched() && !field.valid();
  }
}
