import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reading } from '../../../../core/models';

@Component({
  selector: 'app-readings-table',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="eco-card" style="padding:0;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;
                padding:1rem 1.5rem;border-bottom:1px solid #f3f4f6;">
      <h2 class="eco-section-title">
        Raw readings
        @if (readings.length) {
          <span class="eco-badge eco-badge-info" style="margin-left:8px;vertical-align:middle;">
            {{ readings.length }}
          </span>
        }
      </h2>
      @if (readings.length) {
        <button (click)="exportCsv()" class="eco-btn-outlined"
                style="padding:5px 12px;font-size:0.75rem;">
          ⬇ Export CSV
        </button>
      }
    </div>

    @if (!readings.length) {
      <div class="eco-empty">
        <span class="eco-empty-icon">📭</span>
        <p class="eco-empty-title">No readings to display</p>
      </div>
    } @else {
      <div style="overflow-x:auto;">
        <table class="eco-table">
          <thead>
            <tr>
              <th>Recorded at</th>
              <th>Metric</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            @for (r of paginated(); track r.id) {
              <tr>
                <td style="font-family:monospace;font-size:0.75rem;color:#6b7280;">
                  {{ r.recorded_at | date:'dd MMM yyyy, HH:mm' }}
                </td>
                <td><span class="eco-badge eco-badge-info">{{ r.metric }}</span></td>
                <td style="font-weight:600;color:#111827;">
                  {{ r.value | number:'1.2-4' }}
                </td>
                <td style="color:#6b7280;">{{ r.unit }}</td>
                <td style="color:#9ca3af;font-size:0.75rem;">{{ r.source ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:0.75rem 1.5rem;border-top:1px solid #f3f4f6;">
          <span style="font-size:0.75rem;color:#9ca3af;">
            Showing {{ (page()-1)*pageSize+1 }}–{{ min(page()*pageSize, readings.length) }}
            of {{ readings.length }}
          </span>
          <div style="display:flex;gap:4px;">
            <button (click)="setPage(page()-1)" [disabled]="page()===1"
                    class="eco-btn-outlined" style="padding:4px 10px;font-size:0.75rem;">
              ← Prev
            </button>
            @for (p of pageRange(); track p) {
              <button (click)="setPage(p)"
                      [class]="p===page() ? 'eco-btn-primary' : 'eco-btn-outlined'"
                      style="padding:4px 10px;font-size:0.75rem;">
                {{ p }}
              </button>
            }
            <button (click)="setPage(page()+1)" [disabled]="page()===totalPages()"
                    class="eco-btn-outlined" style="padding:4px 10px;font-size:0.75rem;">
              Next →
            </button>
          </div>
        </div>
      }
    }
  </div>
`,
})
export class ReadingsTableComponent {
  @Input() set readings(val: Reading[]) {
    this._readings = val;
    this.page.set(1); // reset to page 1 when data changes
  }
  get readings() {
    return this._readings;
  }

  @Output() exportRequested = new EventEmitter<void>();

  private _readings: Reading[] = [];
  page = signal(1);
  pageSize = 15;

  totalPages = computed(() => Math.ceil(this.readings.length / this.pageSize));

  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.readings.slice(start, start + this.pageSize);
  });

  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  exportCsv() {
    const header = ['ID', 'Metric', 'Value', 'Unit', 'Recorded At', 'Source'];
    const rows = this.readings.map((r) => [
      r.id,
      r.metric,
      r.value,
      r.unit,
      new Date(r.recorded_at).toISOString(),
      r.source ?? '',
    ]);

    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readings-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
