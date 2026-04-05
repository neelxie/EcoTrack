import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Subject,
  BehaviorSubject,
  switchMap,
  takeUntil,
  tap,
  EMPTY,
} from 'rxjs';

import { ShellComponent } from '../../shared/components/shell/shell.component';
import {
  ReadingsFiltersComponent,
  ReadingFilter,
} from './components/readings-filters/readings-filters.component';
import { ReadingsChartComponent } from './components/readings-chart/readings-chart.component';
import { ReadingsTableComponent } from './components/readings-table/readings-table.component';
import { ReadingsStatsComponent } from './components/readings-stats/readings-stats.component';
import { ReadingService } from '../../core/services/reading.service';
import { StationService } from '../../core/services/station.service';
import { Station, Reading, ReadingSummary } from '../../core/models';

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    ReadingsFiltersComponent,
    ReadingsChartComponent,
    ReadingsTableComponent,
    ReadingsStatsComponent,
  ],
  template: `
    <app-shell>
      <div class="eco-page">
        <!-- Header -->
        <div class="eco-page-header">
          <h1 class="eco-page-title">Readings</h1>
          <p class="eco-page-subtitle">
            Time-series environmental data across stations
          </p>
        </div>

        <!-- Filters -->
        <app-readings-filters
          [stations]="stations()"
          (filterChange)="onFilterChange($event)"
        />

        <!-- No station selected -->
        @if (!activeFilter()?.stationId) {
          <div class="eco-card eco-empty">
            <span class="eco-empty-icon">📍</span>
            <p class="eco-empty-title">Select a station</p>
            <p style="font-size:0.875rem;color:#9ca3af;margin:4px 0 0;">
              Choose a monitoring station from the filter above to load its
              readings.
            </p>
          </div>
        }

        <!-- Loading -->
        @if (loading() && activeFilter()?.stationId) {
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div
              style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;"
            >
              @for (i of [1, 2, 3, 4]; track i) {
                <div
                  class="eco-skeleton"
                  style="height:90px;border-radius:12px;"
                ></div>
              }
            </div>
            <div
              class="eco-skeleton"
              style="height:320px;border-radius:12px;"
            ></div>
          </div>
        }

        <!-- Data loaded -->
        @if (!loading() && activeFilter()?.stationId) {
          <app-readings-stats [summary]="statsSummary()" />
          <app-readings-chart
            [readings]="readings()"
            [metric]="activeFilter()?.metric || 'value'"
            [unit]="unit()"
          />
          <app-readings-table [readings]="readings()" />
        }
      </div>
    </app-shell>
  `,
})
export class ReadingsComponent implements OnInit, OnDestroy {
  stations = signal<Station[]>([]);
  readings = signal<Reading[]>([]);
  loading = signal(false);
  activeFilter = signal<ReadingFilter | null>(null);

  statsSummary = computed(() => {
    const list = this.readings();
    if (!list.length) return null;
    const values = list.map((r) => r.value);
    return {
      station_id: list[0]?.station_id,
      metric: this.activeFilter()?.metric ?? '',
      unit: list[0]?.unit ?? '',
      date: this.activeFilter()?.from ?? '',
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: list.length,
    };
  });

  unit = computed(() => this.readings()[0]?.unit ?? '');

  private filter$ = new BehaviorSubject<ReadingFilter | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private readingSvc: ReadingService,
    private stationSvc: StationService,
  ) {}

  ngOnInit() {
    this.stationSvc
      .list({ active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => this.stations.set(res.data));

    this.filter$
      .pipe(
        tap((f) => {
          this.activeFilter.set(f);
          if (f?.stationId) this.loading.set(true);
        }),
        switchMap((f) => {
          if (!f?.stationId) return EMPTY;
          return this.readingSvc.list(f.stationId, {
            metric: f.metric || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
            page: 1,
          });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          this.readings.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onFilterChange(f: ReadingFilter) {
    this.filter$.next(f);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
