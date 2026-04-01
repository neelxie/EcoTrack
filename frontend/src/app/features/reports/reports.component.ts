import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  takeUntil,
  switchMap,
  combineLatest,
  BehaviorSubject,
  debounceTime,
} from 'rxjs';
import { ReportService } from '../../core/services/report.service';
import { StationService } from '../../core/services/station.service';
import { Station, ReadingSummary } from '../../core/models';
import { ShellComponent } from '../../shared/components/shell/shell.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent],
  template: `
    <app-shell>
      <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Reports</h1>
            <p class="text-sm text-gray-500 mt-1">
              Export and analyse environmental data
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="eco-card">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">
            Report Parameters
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="eco-label">Station</label>
              <select
                [(ngModel)]="selectedStationId"
                (ngModelChange)="onFilterChange()"
                class="eco-input"
              >
                <option [ngValue]="null">All stations</option>
                @for (s of stations(); track s.id) {
                  <option [ngValue]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="eco-label">Metric</label>
              <input
                type="text"
                [(ngModel)]="metric"
                (ngModelChange)="onFilterChange()"
                class="eco-input"
                placeholder="e.g. pm25"
              />
            </div>
            <div>
              <label class="eco-label">From</label>
              <input
                type="date"
                [(ngModel)]="from"
                (ngModelChange)="onFilterChange()"
                class="eco-input"
              />
            </div>
            <div>
              <label class="eco-label">To</label>
              <input
                type="date"
                [(ngModel)]="to"
                (ngModelChange)="onFilterChange()"
                class="eco-input"
              />
            </div>
          </div>
        </div>

        <!-- Export buttons -->
        @if (summaryData().length) {
          <div class="flex gap-3 flex-wrap">
            <button (click)="exportExcel()" class="eco-btn-primary">
              ⬇ Export Excel
            </button>
            <button (click)="exportPdf()" class="eco-btn-outlined">
              ⬇ Export PDF
            </button>
            <button (click)="downloadCsv()" class="eco-btn-secondary">
              ⬇ Download CSV
            </button>
          </div>
        }

        <!-- Results table -->
        <div class="eco-card overflow-x-auto">
          @if (loading()) {
            <div class="py-12 text-center text-gray-400 text-sm">
              Loading report data…
            </div>
          } @else if (summaryData().length === 0) {
            <div class="py-12 text-center text-gray-400 text-sm">
              Select a date range to generate a report.
            </div>
          } @else {
            <table class="eco-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Metric</th>
                  <th>Unit</th>
                  <th>Date</th>
                  <th>Avg</th>
                  <th>Min</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                @for (row of summaryData(); track row.date + row.metric) {
                  <tr>
                    <td>{{ getStationName(row.station_id) }}</td>
                    <td>
                      <span class="eco-badge-info">{{ row.metric }}</span>
                    </td>
                    <td class="text-gray-500">{{ row.unit }}</td>
                    <td>{{ row.date }}</td>
                    <td class="font-medium">{{ row.avg | number: '1.2-2' }}</td>
                    <td class="text-blue-600">
                      {{ row.min | number: '1.2-2' }}
                    </td>
                    <td class="text-red-600">
                      {{ row.max | number: '1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </app-shell>
  `,
})
export class ReportsComponent implements OnInit, OnDestroy {
  stations = signal<Station[]>([]);
  summaryData = signal<ReadingSummary[]>([]);
  loading = signal(false);

  selectedStationId: number | null = null;
  metric = '';
  from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  to = new Date().toISOString().split('T')[0];

  private filter$ = new BehaviorSubject<void>(undefined);
  private destroy$ = new Subject<void>();

  constructor(
    private reportSvc: ReportService,
    private stationSvc: StationService,
  ) {}

  ngOnInit() {
    this.stationSvc
      .list({ active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => this.stations.set(res.data));

    this.filter$
      .pipe(
        debounceTime(400),
        switchMap(() => {
          if (!this.from || !this.to) return [];
          this.loading.set(true);
          const ids = this.selectedStationId
            ? [this.selectedStationId]
            : this.stations().map((s) => s.id);
          return this.reportSvc.getSummary(
            ids,
            this.from,
            this.to,
            this.metric || undefined,
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (data) => {
          this.summaryData.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onFilterChange() {
    this.filter$.next();
  }

  getStationName(id: number): string {
    return this.stations().find((s) => s.id === id)?.name ?? `#${id}`;
  }

  exportExcel() {
    this.reportSvc.exportToExcel(
      this.summaryData(),
      `ecotrack-report-${this.from}-${this.to}`,
    );
  }

  exportPdf() {
    this.reportSvc.exportToPdf(
      this.summaryData(),
      `EcoTrack Report — ${this.from} to ${this.to}`,
      `ecotrack-report-${this.from}-${this.to}`,
    );
  }

  downloadCsv() {
    if (!this.selectedStationId) return;
    this.reportSvc
      .downloadCsv(
        this.selectedStationId,
        this.from,
        this.to,
        this.metric || undefined,
      )
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecotrack-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
