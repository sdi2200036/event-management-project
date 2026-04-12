import { Component, WritableSignal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';

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
    required(p.username, { message: 'Username is required' });
    minLength(p.username, 3);
    required(p.password, { message: 'Password is required' });
    minLength(p.password, 6);
  });
  loading: WritableSignal<boolean> = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.loginFields, async (form) => {
      this.loading.set(true);
      
      return await firstValueFrom(this.authService.login(form().value())
      .pipe(
        switchMap(() => {
          this.loading.set(false);
          this.router.navigate(['/events']);
          return of(undefined);
        }),
        catchError((err) => {
          this.loading.set(false);
          return of([{
            kind: 'credentials',
            field: 'form',
            message: err.error?.message || 'Invalid username or password. Please try again.'
          }]);
        })
      ));
    });
  }
}
