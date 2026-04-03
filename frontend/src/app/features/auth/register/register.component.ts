import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen bg-background flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4"
          >
            <span class="text-white font-bold text-2xl">E</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            Start monitoring the environment
          </p>
        </div>

        <div class="eco-card">
          @if (error()) {
            <div
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
            <div>
              <label class="eco-label">Full name</label>
              <input
                type="text"
                name="name"
                [(ngModel)]="name"
                required
                class="eco-input"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label class="eco-label">Email</label>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                class="eco-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label class="eco-label">Password</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                minlength="8"
                class="eco-input"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label class="eco-label">Confirm password</label>
              <input
                type="password"
                name="password_confirmation"
                [(ngModel)]="passwordConfirmation"
                required
                class="eco-input"
                placeholder="Repeat your password"
              />
              @if (passwordMismatch()) {
                <p class="text-xs text-red-500 mt-1">Passwords do not match.</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="eco-btn-primary w-full mt-2"
            >
              @if (loading()) {
                Creating account…
              } @else {
                Create account
              }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-4">
            Already have an account?
            <a
              routerLink="/auth/login"
              class="text-primary font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  loading = signal(false);
  error = signal('');

  passwordMismatch = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    this.error.set('');
    this.passwordMismatch.set(false);

    if (this.password !== this.passwordConfirmation) {
      this.passwordMismatch.set(true);
      return;
    }

    this.loading.set(true);
    this.auth
      .register(this.name, this.email, this.password, this.passwordConfirmation)
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          const errors = err.error?.errors;
          if (errors) {
            // Laravel validation returns field-keyed errors — flatten to one string
            this.error.set(Object.values(errors).flat().join(' '));
          } else {
            this.error.set(
              err.error?.message ?? 'Registration failed. Please try again.',
            );
          }
          this.loading.set(false);
        },
      });
  }
}
