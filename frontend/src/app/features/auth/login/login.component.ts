import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.services';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="eco-auth-wrap">
      <div class="eco-auth-card">
        <!-- Logo -->
        <div class="eco-auth-logo-wrap">
          <div class="eco-auth-logo">E</div>
          <h1 class="eco-auth-title">Welcome back</h1>
          <p class="eco-auth-subtitle">Sign in to EcoTrack</p>
        </div>

        <!-- Card -->
        <div class="eco-card" style="padding: 2rem">
          <!-- Server error banner -->
          @if (serverError()) {
            <div
              class="eco-alert eco-alert-error"
              style="margin-bottom:1.25rem"
            >
              <span>⚠️</span>
              <span>{{ serverError() }}</span>
            </div>
          }

          <!-- Form -->
          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <!-- Email -->
            <div class="eco-form-field" style="margin-bottom:1rem">
              <label class="eco-label" for="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                email
                #emailRef="ngModel"
                [class]="
                  emailRef.touched && emailRef.invalid
                    ? 'eco-input error'
                    : 'eco-input'
                "
                placeholder="you@example.com"
                autocomplete="email"
              />
              @if (emailRef.touched && emailRef.errors?.['required']) {
                <span class="eco-field-error">Email is required.</span>
              }
              @if (emailRef.touched && emailRef.errors?.['email']) {
                <span class="eco-field-error"
                  >Enter a valid email address.</span
                >
              }
            </div>

            <!-- Password -->
            <div class="eco-form-field" style="margin-bottom:1.5rem">
              <div
                style="display:flex;justify-content:space-between;align-items:center"
              >
                <label class="eco-label" for="password">Password</label>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                minlength="8"
                #passwordRef="ngModel"
                [class]="
                  passwordRef.touched && passwordRef.invalid
                    ? 'eco-input error'
                    : 'eco-input'
                "
                placeholder="••••••••"
                autocomplete="current-password"
              />
              @if (passwordRef.touched && passwordRef.errors?.['required']) {
                <span class="eco-field-error">Password is required.</span>
              }
              @if (passwordRef.touched && passwordRef.errors?.['minlength']) {
                <span class="eco-field-error"
                  >Password must be at least 8 characters.</span
                >
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="eco-btn eco-btn-primary"
              style="width:100%"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="eco-spinner"></span>
                Signing in…
              } @else {
                Sign in
              }
            </button>
          </form>

          <!-- Footer link -->
          <p
            style="text-align:center;margin-top:1.25rem;font-size:0.875rem;color:#6B7280"
          >
            Don't have an account?
            <a
              routerLink="/auth/register"
              style="color:#1565C0;font-weight:500;margin-left:0.25rem"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  serverError = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    this.loading.set(true);
    this.serverError.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        const msg =
          err.error?.message ||
          err.error?.errors?.email?.[0] ||
          'Invalid email or password. Please try again.';
        this.serverError.set(msg);
        this.loading.set(false);
      },
    });
  }
}
