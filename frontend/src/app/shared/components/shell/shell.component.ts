import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.services';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="eco-shell">
      <!-- Sidebar -->
      <aside class="eco-sidebar">
        <div class="eco-sidebar-header">
          <div class="eco-sidebar-logo">E</div>
          <span class="eco-sidebar-title">EcoTrack</span>
        </div>

        <nav class="eco-sidebar-nav">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              class="eco-nav-item"
            >
              <span class="eco-nav-icon">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="eco-sidebar-footer">
          <div class="eco-user-row">
            <div class="eco-avatar">
              {{ auth.user()?.name?.charAt(0)?.toUpperCase() ?? '?' }}
            </div>
            <div style="flex:1;min-width:0">
              <div class="eco-user-name">{{ auth.user()?.name }}</div>
              <div class="eco-user-email">{{ auth.user()?.email }}</div>
            </div>
          </div>
          <button
            (click)="logout()"
            class="eco-nav-item"
            style="width:100%;border:none;text-align:left"
          >
            <span class="eco-nav-icon">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="eco-main">
        <ng-content />
      </main>
    </div>
  `,
})
export class ShellComponent {
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/stations', label: 'Stations', icon: '📍' },
    { path: '/readings', label: 'Readings', icon: '📈' },
    { path: '/alerts', label: 'Alerts', icon: '🔔' },
    { path: '/reports', label: 'Reports', icon: '📄' },
  ];

  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe();
  }
}
