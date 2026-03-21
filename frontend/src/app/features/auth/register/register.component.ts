import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        address: [''],
        city: [''],
        country: [''],
        postal_code: [''],
        afm: ['', [Validators.minLength(9), Validators.maxLength(9)]],
        role: ['participant', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.registerForm.value).subscribe({
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

  get f() {
    return this.registerForm.controls;
  }
}
