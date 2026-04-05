import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.services';
import { AlertBadgeComponent } from '../../../features/alerts/components/alert-badge/alert-badge.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, AlertBadgeComponent],
  styles: [
    `
      :host {
        display: flex;
        height: 100vh;
        overflow: hidden;
      }
      aside {
        display: flex;
        flex-direction: column;
        width: 256px;
        flex-shrink: 0;
        background: #1565c0;
        overflow-y: auto;
      }
      main {
        flex: 1;
        overflow-y: auto;
        background: #f5f7fa;
      }
    `,
  ],
  template: `
    <aside>
      <!-- Logo -->
      <div
        style="padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.12);"
      >
        <div style="display:flex; align-items:center; gap:10px;">
          <div
            style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);
                      display:flex;align-items:center;justify-content:center;"
          >
            <span style="color:#fff;font-weight:700;font-size:14px;">E</span>
          </div>
          <span style="color:#fff;font-weight:600;font-size:1.1rem;"
            >EcoTrack</span
          >
        </div>
      </div>

      <!-- Navigation -->
      <nav style="flex:1; padding: 12px;">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            class="nav-link"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
        <!-- Alerts with live badge -->
        <app-alert-badge />
      </nav>

      <!-- User footer -->
      <div style="padding:12px;border-top:1px solid rgba(255,255,255,0.12);">
        <div
          style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:4px;"
        >
          <div
            style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.2);
                      display:flex;align-items:center;justify-content:center;flex-shrink:0;"
          >
            <span style="color:#fff;font-size:13px;font-weight:600;">
              {{ auth.user()?.name?.charAt(0)?.toUpperCase() ?? '?' }}
            </span>
          </div>
          <div style="flex:1;min-width:0;">
            <div
              style="color:#fff;font-size:13px;font-weight:500;
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            >
              {{ auth.user()?.name }}
            </div>
            <div
              style="color:rgba(255,255,255,0.55);font-size:11px;
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            >
              {{ auth.user()?.email }}
            </div>
          </div>
        </div>
        <button
          (click)="logout()"
          class="nav-link"
          style="width:100%;border:none;cursor:pointer;background:none;"
        >
          <span class="nav-icon">🚪</span> Sign out
        </button>
      </div>
    </aside>

    <main>
      <ng-content />
    </main>
  `,
})
export class ShellComponent {
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/stations', label: 'Stations', icon: '📍' },
    { path: '/readings', label: 'Readings', icon: '📈' },
    { path: '/reports', label: 'Reports', icon: '📄' },
  ];

  constructor(public auth: AuthService) {}
  logout() {
    this.auth.logout().subscribe();
  }
}
