import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.services';

@Component({
  selector: 'app-login',
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
          <h1 class="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p class="text-gray-500 text-sm mt-1">Sign in to EcoTrack</p>
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
                class="eco-input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              [disabled]="loading()"
              class="eco-btn-primary w-full mt-2"
            >
              @if (loading()) {
                Signing in…
              } @else {
                Sign in
              }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-4">
            No account?
            <a
              routerLink="/auth/register"
              class="text-primary font-medium hover:underline"
              >Register</a
            >
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
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(
          err.error?.message ?? 'Login failed. Please check your credentials.',
        );
        this.loading.set(false);
      },
    });
  }
}
