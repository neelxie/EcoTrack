import {
  Component, OnInit, OnDestroy,
  signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Subject, BehaviorSubject, switchMap,
  takeUntil, tap, EMPTY, distinctUntilChanged
} from 'rxjs';

import { ShellComponent } from '../../shared/components/shell/shell.component';
import { ReportFiltersComponent, ReportFilter } from './components/report-filters/report-filters.component';
import { ReportChartComponent } from './components/report-chart/report-chart.component';
import { ReportTableComponent } from './components/report-table/report-table.component';
import { ReportExportComponent } from './components/report-export/report-export.component';

import { ReportService } from '../../core/services/report.service';
import { StationService } from '../../core/services/station.service';
import { Station, ReadingSummary } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    ReportFiltersComponent,
    ReportChartComponent,
    ReportTableComponent,
    ReportExportComponent,
  ],
  template: `
    <app-shell>
      <div class="eco-page">

        <!-- Header -->
        <div class="eco-page-header">
          <div>
            <h1>Reports</h1>
            <p>Analyse trends and export environmental data</p>
          </div>
          @if (lastFetched()) {
            <span style="font-size:0.75rem;color:#94A3B8;align-self:center;">
              Updated {{ lastFetched() | date:'HH:mm:ss' }}
            </span>
          }
        </div>

        <!-- Filters -->
        <app-report-filters
          [stations]="stations()"
          (filterChange)="onFilter($event)" />

        <!-- No selection nudge -->
        @if (!loading() && !activeFilter()?.stationIds?.length) {
          <div class="eco-card"
               style="text-align:center;padding:3rem;border:2px dashed #E2E8F0;">
            <span style="font-size:3rem;">📍</span>
            <p style="font-size:0.875rem;color:#64748B;margin:12px 0 0;">
              Select at least one station and a date range above to generate a report.
            </p>
          </div>
        }

        <!-- Loading skeletons -->
        @if (loading()) {
          <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;">
            <div class="eco-card eco-skeleton" style="height:80px;"></div>
            <div class="eco-card eco-skeleton" style="height:320px;"></div>
            <div class="eco-card eco-skeleton" style="height:300px;"></div>
          </div>
        }

        <!-- Results -->
        @if (!loading() && summaryData().length) {

          <!-- KPI strip -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;">
            @for (kpi of kpis(); track kpi.label) {
              <div class="eco-card" style="text-align:center;padding:1rem;">
                <p style="font-size:0.7rem;font-weight:600;color:#64748B;
                           text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;">
                  {{ kpi.label }}
                </p>
                <p style="font-size:1.5rem;font-weight:700;color:{{ kpi.color }};margin:0;">
                  {{ kpi.value }}
                </p>
              </div>
            }
          </div>

          <!-- Export bar -->
          <app-report-export
            [data]="summaryData()"
            [stationNames]="stationNameMap()"
            [title]="reportTitle()"
            [filename]="reportFilename()" />

          <!-- Chart -->
          <app-report-chart [data]="summaryData()" />

          <!-- Table -->
          <app-report-table
            [data]="summaryData()"
            [stationNames]="stationNameMap()" />

        }

        <!-- Empty result (filters set, but no data) -->
        @if (!loading() && activeFilter()?.stationIds?.length && !summaryData().length) {
          <div class="eco-card" style="text-align:center;padding:3rem;">
            <span style="font-size:3rem;">📭</span>
            <p style="font-size:0.875rem;color:#64748B;margin:12px 0 0;">
              No readings found for this combination. Try widening the date range or changing the metric.
            </p>
          </div>
        }

      </div>
    </app-shell>
  `,
})
export class ReportsComponent implements OnInit, OnDestroy {
  stations     = signal<Station[]>([]);
  summaryData  = signal<ReadingSummary[]>([]);
  loading      = signal(false);
  lastFetched  = signal<Date | null>(null);
  activeFilter = signal<ReportFilter | null>(null);

  stationNameMap = computed(() => {
    const map: Record<number, string> = {};
    this.stations().forEach(s => map[s.id] = s.name);
    return map;
  });

  kpis = computed(() => {
    const d = this.summaryData();
    if (!d.length) return [];
    const avgs   = d.map(r => r.avg);
    const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    return [
      { label: 'Data rows',    value: d.length.toLocaleString(),          color: '#1565C0' },
      { label: 'Stations',     value: new Set(d.map(r=>r.station_id)).size, color: '#00897B' },
      { label: 'Metrics',      value: new Set(d.map(r=>r.metric)).size,    color: '#F57F17' },
      { label: 'Overall avg',  value: overall.toFixed(2),                  color: '#6A1B9A' },
    ];
  });

  reportTitle = computed(() => {
    const f = this.activeFilter();
    return `EcoTrack Report — ${f?.from ?? ''} to ${f?.to ?? ''}`;
  });

  reportFilename = computed(() => {
    const f = this.activeFilter();
    return `ecotrack-report-${f?.from ?? 'start'}-to-${f?.to ?? 'end'}`;
  });

  private filter$  = new BehaviorSubject<ReportFilter | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private reportSvc:  ReportService,
    private stationSvc: StationService,
  ) {}

  ngOnInit() {
    this.stationSvc.list({ active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.stations.set(res.data));

    this.filter$.pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(f => {
        this.activeFilter.set(f);
        if (f?.stationIds?.length) this.loading.set(true);
        else { this.summaryData.set([]); }
      }),
      switchMap(f => {
        if (!f?.stationIds?.length || !f.from || !f.to) return EMPTY;
        return this.reportSvc.getSummary(
          f.stationIds, f.from, f.to, f.metric || undefined
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: data => {
        this.summaryData.set(data);
        this.lastFetched.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(f: ReportFilter) { this.filter$.next(f); }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}