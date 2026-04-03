import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { StationService } from '../../core/services/station.service';
import { AlertService } from '../../core/services/alert.services';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { Station, Alert } from '../../core/models';

interface KpiCard {
  label: string;
  value: number | string;
  icon: string;
  iconBg: string;
  sub?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ShellComponent, DatePipe, DecimalPipe],
  template: `
    <app-shell>
      <div class="eco-page">
        <!-- Top bar -->
        <div class="eco-topbar">
          <div>
            <h1 class="eco-page-title">Dashboard</h1>
            <p class="eco-page-subtitle">Environmental monitoring overview</p>
          </div>
          <span class="eco-meta"
            >Updated {{ now | date: 'd MMM y, HH:mm' }}</span
          >
        </div>

        <!-- KPI row -->
        @if (loadingKpis()) {
          <div class="eco-kpi-grid" style="margin-bottom:1.25rem">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="eco-kpi-card">
                <div
                  class="eco-skeleton"
                  style="width:3rem;height:3rem;border-radius:0.75rem"
                ></div>
                <div style="flex:1">
                  <div
                    class="eco-skeleton"
                    style="height:0.75rem;width:60%;margin-bottom:0.5rem"
                  ></div>
                  <div
                    class="eco-skeleton"
                    style="height:1.5rem;width:40%"
                  ></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="eco-kpi-grid" style="margin-bottom:1.25rem">
            @for (kpi of kpis(); track kpi.label) {
              <div class="eco-kpi-card">
                <div class="eco-kpi-icon" [class]="kpi.iconBg">
                  {{ kpi.icon }}
                </div>
                <div>
                  <p class="eco-kpi-label">{{ kpi.label }}</p>
                  <p class="eco-kpi-value">{{ kpi.value }}</p>
                  @if (kpi.sub) {
                    <p class="eco-kpi-sub">{{ kpi.sub }}</p>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Active alerts banner -->
        @if (triggeredAlerts().length) {
          <div class="eco-card-accent-warning" style="margin-bottom:1.25rem">
            <div class="eco-section-header" style="margin-bottom:0.75rem">
              <h2 class="eco-section-title">🔔 Triggered alerts</h2>
              <a routerLink="/alerts" class="eco-section-link">Manage →</a>
            </div>
            <ul class="eco-alert-list">
              @for (alert of triggeredAlerts(); track alert.id) {
                <li class="eco-alert-row">
                  <span class="eco-dot eco-dot-yellow"></span>
                  <span class="eco-alert-row-label">
                    <strong>{{
                      alert.station?.name ?? 'Station #' + alert.station_id
                    }}</strong>
                    &mdash; {{ alert.metric }}
                    {{ operatorLabel(alert.operator) }}
                    {{ alert.threshold }}
                  </span>
                  @if (alert.last_triggered_at) {
                    <span class="eco-alert-row-meta">
                      {{ alert.last_triggered_at | date: 'd MMM, HH:mm' }}
                    </span>
                  }
                  <span class="eco-badge-warning">Active</span>
                </li>
              }
            </ul>
          </div>
        }

        <!-- Two-column lower section -->
        <div class="eco-two-col">
          <!-- Recent stations -->
          <div class="eco-card" style="padding:1.25rem">
            <div class="eco-section-header">
              <h2 class="eco-section-title">📍 Recent stations</h2>
              <a routerLink="/stations" class="eco-section-link">View all →</a>
            </div>

            @if (loadingStations()) {
              <div
                class="eco-skeleton"
                style="height:200px;border-radius:8px"
              ></div>
            } @else if (recentStations().length === 0) {
              <div class="eco-empty">
                <span class="eco-empty-icon">📍</span>
                <p class="eco-empty-title">No stations yet</p>
                <a routerLink="/stations" class="eco-section-link"
                  >Add your first station</a
                >
              </div>
            } @else {
              <table class="eco-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of recentStations(); track s.id) {
                    <tr>
                      <td>
                        <div style="font-weight:500;color:#111827">
                          {{ s.name }}
                        </div>
                        <div style="font-size:0.75rem;color:#9CA3AF">
                          {{ s.city }}, {{ s.country }}
                        </div>
                      </td>
                      <td>
                        <span class="eco-badge" [class]="typeBadge(s.type)">
                          {{ s.type.replace('_', ' ') }}
                        </span>
                      </td>
                      <td>
                        @if (s.is_active) {
                          <span style="display:inline-flex;align-items:center">
                            <span class="eco-dot eco-dot-green"></span>
                            <span style="font-size:0.8rem;color:#166534"
                              >Active</span
                            >
                          </span>
                        } @else {
                          <span style="display:inline-flex;align-items:center">
                            <span class="eco-dot eco-dot-red"></span>
                            <span style="font-size:0.8rem;color:#991B1B"
                              >Inactive</span
                            >
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- All alerts -->
          <div class="eco-card" style="padding:1.25rem">
            <div class="eco-section-header">
              <h2 class="eco-section-title">🔔 My alerts</h2>
              <a routerLink="/alerts" class="eco-section-link">Manage →</a>
            </div>

            @if (loadingAlerts()) {
              <div
                class="eco-skeleton"
                style="height:200px;border-radius:8px"
              ></div>
            } @else if (allAlerts().length === 0) {
              <div class="eco-empty">
                <span class="eco-empty-icon">🔔</span>
                <p class="eco-empty-title">No alerts configured</p>
                <a routerLink="/alerts" class="eco-section-link"
                  >Set up your first alert</a
                >
              </div>
            } @else {
              <ul class="eco-alert-list">
                @for (alert of allAlerts(); track alert.id) {
                  <li class="eco-alert-row">
                    <span
                      class="eco-dot"
                      [class]="
                        alert.is_active ? 'eco-dot-green' : 'eco-dot-red'
                      "
                    ></span>
                    <span class="eco-alert-row-label">
                      {{
                        alert.station?.name ?? 'Station #' + alert.station_id
                      }}
                      <span
                        style="color:#9CA3AF;font-size:0.8rem;margin-left:0.25rem"
                      >
                        {{ alert.metric }} {{ operatorLabel(alert.operator) }}
                        {{ alert.threshold }}
                      </span>
                    </span>
                    @if (alert.is_active) {
                      <span class="eco-badge eco-badge-success">On</span>
                    } @else {
                      <span class="eco-badge eco-badge-gray">Off</span>
                    }
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <!-- Data sources bar -->
        <div class="eco-card" style="margin-top:1.25rem;padding:1.25rem">
          <div class="eco-section-header">
            <h2 class="eco-section-title">🌍 Connected data sources</h2>
          </div>
          <div style="display:flex;gap:1rem;flex-wrap:wrap">
            @for (src of dataSources; track src.name) {
              <div
                style="display:flex;align-items:center;gap:0.5rem;
                          padding:0.5rem 1rem;border-radius:8px;
                          border:1.5px solid #E5E7EB;background:#FAFAFA"
              >
                <span>{{ src.icon }}</span>
                <div>
                  <div
                    style="font-size:0.8125rem;font-weight:600;color:#111827"
                  >
                    {{ src.name }}
                  </div>
                  <div style="font-size:0.7rem;color:#9CA3AF">
                    {{ src.desc }}
                  </div>
                </div>
                <span
                  class="eco-badge eco-badge-success"
                  style="margin-left:0.5rem"
                >
                  Live
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  now = new Date();

  kpis = signal<KpiCard[]>([]);
  recentStations = signal<Station[]>([]);
  allAlerts = signal<Alert[]>([]);
  triggeredAlerts = signal<Alert[]>([]);

  loadingKpis = signal(true);
  loadingStations = signal(true);
  loadingAlerts = signal(true);

  private destroy$ = new Subject<void>();

  dataSources = [
    { name: 'OpenAQ', icon: '💨', desc: 'Air quality readings' },
    { name: 'NOAA / NWS', icon: '🌤', desc: 'Weather data' },
    { name: 'Our World in Data', icon: '🌍', desc: 'Emissions & climate' },
  ];

  constructor(
    private stationSvc: StationService,
    private alertSvc: AlertService,
  ) {}

  ngOnInit() {
    // Stations
    this.stationSvc
      .list({ page: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.recentStations.set(res.data.slice(0, 6));
        this.loadingStations.set(false);

        const active = res.data.filter((s) => s.is_active).length;
        const inactive = res.data.length - active;

        this.kpis.update((k) => [
          ...k,
          {
            label: 'Total stations',
            value: res.total,
            icon: '📍',
            iconBg: 'eco-kpi-icon-blue',
            sub: `${active} active · ${inactive} inactive`,
          },
          {
            label: 'Active stations',
            value: active,
            icon: '✅',
            iconBg: 'eco-kpi-icon-green',
          },
        ]);

        this.checkKpisDone();
      });

    // Alerts
    this.alertSvc
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((alerts) => {
        this.allAlerts.set(alerts.slice(0, 8));
        this.triggeredAlerts.set(
          alerts.filter((a) => a.is_active && a.last_triggered_at),
        );
        this.loadingAlerts.set(false);

        this.kpis.update((k) => [
          ...k,
          {
            label: 'Active alerts',
            value: alerts.filter((a) => a.is_active).length,
            icon: '🔔',
            iconBg: 'eco-kpi-icon-yellow',
            sub: `${this.triggeredAlerts().length} recently triggered`,
          },
          {
            label: 'Data sources',
            value: 3,
            icon: '🌍',
            iconBg: 'eco-kpi-icon-teal',
            sub: 'OpenAQ · NOAA · OWID',
          },
        ]);

        this.checkKpisDone();
      });
  }

  // Only mark KPIs done once both requests have contributed
  private checkKpisDone() {
    if (this.kpis().length >= 4) this.loadingKpis.set(false);
  }

  operatorLabel(op: string): string {
    return { gt: '>', lt: '<', gte: '≥', lte: '≤', eq: '=' }[op] ?? op;
  }

  typeBadge(type: string): string {
    return (
      {
        air_quality: 'eco-badge-info',
        weather: 'eco-badge-success',
        emissions: 'eco-badge-warning',
      }[type] ?? 'eco-badge-gray'
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
