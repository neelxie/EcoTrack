import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.services';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="eco-auth-wrap">
      <div class="eco-auth-card">
        <div class="eco-auth-logo-wrap">
          <div class="eco-auth-logo">E</div>
          <h1 class="eco-auth-title">Create account</h1>
          <p class="eco-auth-subtitle">Start monitoring with EcoTrack</p>
        </div>

        <div class="eco-card" style="padding: 2rem">
          @if (serverError()) {
            <div
              class="eco-alert eco-alert-error"
              style="margin-bottom:1.25rem"
            >
              <span>⚠️</span>
              <span>{{ serverError() }}</span>
            </div>
          }

          <form (ngSubmit)="submit()" #regForm="ngForm">
            <!-- Name -->
            <div class="eco-form-field" style="margin-bottom:1rem">
              <label class="eco-label" for="name">Full name</label>
              <input
                id="name"
                type="text"
                name="name"
                [(ngModel)]="name"
                required
                #nameRef="ngModel"
                [class]="
                  nameRef.touched && nameRef.invalid
                    ? 'eco-input error'
                    : 'eco-input'
                "
                placeholder="Jane Smith"
                autocomplete="name"
              />
              @if (nameRef.touched && nameRef.errors?.['required']) {
                <span class="eco-field-error">Name is required.</span>
              }
            </div>

            <!-- Email -->
            <div class="eco-form-field" style="margin-bottom:1rem">
              <label class="eco-label" for="reg-email">Email address</label>
              <input
                id="reg-email"
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
            <div class="eco-form-field" style="margin-bottom:1rem">
              <label class="eco-label" for="reg-password">Password</label>
              <input
                id="reg-password"
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
                placeholder="Min. 8 characters"
                autocomplete="new-password"
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

            <!-- Confirm password -->
            <div class="eco-form-field" style="margin-bottom:1.5rem">
              <label class="eco-label" for="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                name="password_confirmation"
                [(ngModel)]="passwordConfirm"
                required
                #confirmRef="ngModel"
                [class]="
                  confirmRef.touched && passwordMismatch()
                    ? 'eco-input error'
                    : 'eco-input'
                "
                placeholder="Repeat your password"
                autocomplete="new-password"
              />
              @if (confirmRef.touched && passwordMismatch()) {
                <span class="eco-field-error">Passwords do not match.</span>
              }
            </div>

            <button
              type="submit"
              class="eco-btn eco-btn-primary"
              style="width:100%"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="eco-spinner"></span>
                Creating account…
              } @else {
                Create account
              }
            </button>
          </form>

          <p
            style="text-align:center;margin-top:1.25rem;font-size:0.875rem;color:#6B7280"
          >
            Already have an account?
            <a
              routerLink="/auth/login"
              style="color:#1565C0;font-weight:500;margin-left:0.25rem"
              >Sign in</a
            >
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
  passwordConfirm = '';

  loading = signal(false);
  serverError = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  passwordMismatch(): boolean {
    return this.password !== this.passwordConfirm && !!this.passwordConfirm;
  }

  submit() {
    if (this.passwordMismatch()) return;

    this.loading.set(true);
    this.serverError.set('');

    this.auth
      .register(this.name, this.email, this.password, this.passwordConfirm)
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: HttpErrorResponse) => {
          // Laravel validation errors come back as { errors: { field: [msg] } }
          const laravelErrors = err.error?.errors;
          if (laravelErrors) {
            const firstField = Object.keys(laravelErrors)[0];
            this.serverError.set(laravelErrors[firstField][0]);
          } else {
            this.serverError.set(
              err.error?.message ?? 'Registration failed. Please try again.',
            );
          }
          this.loading.set(false);
        },
      });
  }
}
