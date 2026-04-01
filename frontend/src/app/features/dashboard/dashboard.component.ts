import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, combineLatest, takeUntil, forkJoin } from 'rxjs';
import { StationService } from '../../core/services/station.service';
import { AlertService } from '../../core/services/alert.services';
import { ReadingService } from '../../core/services/reading.service';
import { Station, Alert, ReadingSummary } from '../../core/models';
import { ShellComponent } from '../../shared/components/shell/shell.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ShellComponent],
  template: `
    <app-shell>
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p class="text-sm text-gray-500 mt-1">
              Environmental monitoring overview
            </p>
          </div>
          <span class="text-xs text-gray-400"
            >Last updated: {{ now | date: 'medium' }}</span
          >
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (kpi of kpis(); track kpi.label) {
            <div class="eco-card flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                [class]="kpi.bgClass"
              >
                {{ kpi.icon }}
              </div>
              <div>
                <p
                  class="text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {{ kpi.label }}
                </p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ kpi.value }}
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Active Alerts -->
        @if (activeAlerts().length) {
          <div class="eco-card border-l-4 border-warning">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">
              🔔 Active Alerts
            </h2>
            <div class="space-y-2">
              @for (alert of activeAlerts(); track alert.id) {
                <div
                  class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span class="text-sm text-gray-800">
                    {{ alert.station?.name }} — {{ alert.metric }}
                    {{ alert.operator }} {{ alert.threshold }}
                  </span>
                  <span class="eco-badge-warning">Active</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Stations summary -->
        <div class="eco-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700">Recent Stations</h2>
            <a
              routerLink="/stations"
              class="text-xs text-primary hover:underline"
              >View all →</a
            >
          </div>
          <table class="eco-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>City</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (s of stations(); track s.id) {
                <tr>
                  <td class="font-medium">{{ s.name }}</td>
                  <td>{{ s.city }}, {{ s.country }}</td>
                  <td>
                    <span class="eco-badge-info">{{ s.type }}</span>
                  </td>
                  <td>
                    @if (s.is_active) {
                      <span class="eco-badge-success">Active</span>
                    } @else {
                      <span class="eco-badge-error">Inactive</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </app-shell>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  stations = signal<Station[]>([]);
  activeAlerts = signal<Alert[]>([]);
  kpis = signal<any[]>([]);
  now = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private stationSvc: StationService,
    private alertSvc: AlertService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.stationSvc.list({ active: true }),
      this.alertSvc.list(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([stationsRes, alerts]) => {
        this.stations.set(stationsRes.data.slice(0, 8));
        this.activeAlerts.set(alerts.filter((a) => a.is_active).slice(0, 5));
        this.kpis.set([
          {
            label: 'Total Stations',
            value: stationsRes.total,
            icon: '📍',
            bgClass: 'bg-blue-50',
          },
          {
            label: 'Active Stations',
            value: stationsRes.data.filter((s) => s.is_active).length,
            icon: '✅',
            bgClass: 'bg-green-50',
          },
          {
            label: 'Active Alerts',
            value: alerts.filter((a) => a.is_active).length,
            icon: '🔔',
            bgClass: 'bg-yellow-50',
          },
          {
            label: 'Data Sources',
            value: 3,
            icon: '🌍',
            bgClass: 'bg-purple-50',
          },
        ]);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
