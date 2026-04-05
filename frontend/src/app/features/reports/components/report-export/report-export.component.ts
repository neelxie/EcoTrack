import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingSummary } from '../../../../core/models';
import { ReportService } from '../../../../core/services/report.service';

@Component({
  selector: 'app-report-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="eco-card"
      style="display:flex;align-items:center;justify-content:space-between;
                flex-wrap:wrap;gap:12px;padding:1rem 1.5rem;"
    >
      <div>
        <p style="font-size:0.875rem;font-weight:600;color:#374151;margin:0;">
          Export report
        </p>
        <p style="font-size:0.75rem;color:#94A3B8;margin:2px 0 0;">
          {{ rowCount }} rows · {{ metricCount }} metrics ·
          {{ stationCount }} stations
        </p>
      </div>

      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <!-- Excel -->
        <button
          (click)="doExport('excel')"
          [disabled]="!rowCount || exporting() === 'excel'"
          class="eco-btn-primary"
          style="gap:6px;"
        >
          @if (exporting() === 'excel') {
            <span class="eco-spinner"></span>
          } @else {
            <span>📊</span>
          }
          Excel
        </button>

        <!-- PDF -->
        <button
          (click)="doExport('pdf')"
          [disabled]="!rowCount || exporting() === 'pdf'"
          class="eco-btn-outlined"
          style="gap:6px;"
        >
          @if (exporting() === 'pdf') {
            <span class="eco-spinner"></span>
          } @else {
            <span>📄</span>
          }
          PDF
        </button>

        <!-- CSV -->
        <button
          (click)="doExport('csv')"
          [disabled]="!rowCount || exporting() === 'csv'"
          class="eco-btn-ghost"
          style="gap:6px;border:1.5px solid #E2E8F0;"
        >
          @if (exporting() === 'csv') {
            <span class="eco-spinner"></span>
          } @else {
            <span>📋</span>
          }
          CSV
        </button>
      </div>
    </div>
  `,
})
export class ReportExportComponent {
  @Input() data: ReadingSummary[] = [];
  @Input() stationNames: Record<number, string> = {};
  @Input() title = 'EcoTrack Report';
  @Input() filename = 'ecotrack-report';

  exporting = signal<string>('');

  get rowCount() {
    return this.data.length;
  }
  get metricCount() {
    return new Set(this.data.map((r) => r.metric)).size;
  }
  get stationCount() {
    return new Set(this.data.map((r) => r.station_id)).size;
  }

  constructor(private reportSvc: ReportService) {}

  doExport(format: 'excel' | 'pdf' | 'csv') {
    if (!this.data.length) return;
    this.exporting.set(format);

    // Small timeout so the spinner renders before the (potentially heavy) export
    setTimeout(() => {
      try {
        const enriched = this.data.map((r) => ({
          ...r,
          station_name:
            this.stationNames[r.station_id] ?? `Station ${r.station_id}`,
        }));

        if (format === 'excel') {
          this.reportSvc.exportToExcel(enriched, this.filename);
        } else if (format === 'pdf') {
          this.reportSvc.exportToPdf(enriched, this.title, this.filename);
        } else {
          this.exportCsv(enriched);
        }
      } finally {
        this.exporting.set('');
      }
    }, 50);
  }

  private exportCsv(data: any[]) {
    const headers = ['Station', 'Metric', 'Unit', 'Date', 'Avg', 'Min', 'Max'];
    const rows = data.map((r) => [
      r.station_name,
      r.metric,
      r.unit,
      r.date,
      r.avg.toFixed(4),
      r.min.toFixed(4),
      r.max.toFixed(4),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${this.filename}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }
}
