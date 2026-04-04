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
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Readings</h1>
          <p class="text-sm text-gray-500 mt-1">
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
          <div
            class="eco-card flex flex-col items-center justify-center py-16 text-center"
          >
            <span class="text-5xl mb-4">📍</span>
            <h3 class="text-base font-medium text-gray-700">
              Select a station
            </h3>
            <p class="text-sm text-gray-400 mt-1 max-w-sm">
              Choose a monitoring station from the filter above to load its
              readings and view charts.
            </p>
          </div>
        }

        <!-- Loading -->
        @if (loading() && activeFilter()?.stationId) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="eco-card h-24 animate-pulse bg-gray-50"></div>
              }
            </div>
            <div class="eco-card h-72 animate-pulse bg-gray-50"></div>
          </div>
        }

        <!-- Data loaded -->
        @if (!loading() && activeFilter()?.stationId) {
          <!-- Stats bar -->
          <app-readings-stats [summary]="statsSummary()" />

          <!-- Chart -->
          <app-readings-chart
            [readings]="readings()"
            [metric]="activeFilter()?.metric || 'value'"
            [unit]="unit()"
          />

          <!-- Table -->
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

  // Derived stats from readings
  statsSummary = computed(() => {
    const list = this.readings();
    if (!list.length) return null;

    const values = list.map((r) => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const unit = list[0]?.unit ?? '';

    return {
      station_id: list[0]?.station_id,
      metric: this.activeFilter()?.metric ?? '',
      unit,
      date: this.activeFilter()?.from ?? '',
      avg,
      min,
      max,
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
    // Load all stations for the filter dropdown
    this.stationSvc
      .list({ active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => this.stations.set(res.data));

    // React to filter changes
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
