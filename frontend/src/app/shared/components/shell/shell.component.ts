import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.services';
import { AlertBadgeComponent } from '../../../features/alerts/components/alert-badge/alert-badge.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    AlertBadgeComponent,
  ],
  template: `
    <div class="flex h-screen bg-background">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-primary flex flex-col shadow-elevated flex-shrink-0"
      >
        <!-- Logo -->
        <div class="px-6 py-5 border-b border-primary-light">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm">E</span>
            </div>
            <span class="text-white font-semibold text-lg">EcoTrack</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          @for (item of staticNavItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-white/20 text-white"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100
                      hover:bg-white/10 hover:text-white transition-all duration-150
                      text-sm font-medium"
            >
              <span class="text-lg">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }

          <!-- Alerts nav item (has live badge) -->
          <app-alert-badge />

          @for (item of bottomNavItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-white/20 text-white"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100
                      hover:bg-white/10 hover:text-white transition-all duration-150
                      text-sm font-medium"
            >
              <span class="text-lg">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User footer -->
        <div class="px-3 py-4 border-t border-primary-light">
          <div class="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
            >
              <span class="text-white text-sm font-medium">
                {{ auth.user()?.name?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">
                {{ auth.user()?.name }}
              </p>
              <p class="text-blue-200 text-xs truncate">
                {{ auth.user()?.email }}
              </p>
            </div>
          </div>
          <button
            (click)="logout()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-100
                         hover:bg-white/10 hover:text-white transition-all duration-150 text-sm"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      <!-- Page content -->
      <main class="flex-1 overflow-auto">
        <ng-content />
      </main>
    </div>
  `,
})
export class ShellComponent {
  staticNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/stations', label: 'Stations', icon: '📍' },
    { path: '/readings', label: 'Readings', icon: '📈' },
  ];

  // Alerts is handled separately by <app-alert-badge>

  bottomNavItems = [{ path: '/reports', label: 'Reports', icon: '📄' }];

  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe();
  }
}
