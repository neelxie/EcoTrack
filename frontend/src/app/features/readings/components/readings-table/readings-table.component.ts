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
    <div class="eco-card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-700">
          Raw readings
          @if (readings.length) {
            <span class="ml-2 eco-badge-info">{{ readings.length }}</span>
          }
        </h2>

        @if (readings.length) {
          <button
            (click)="exportCsv()"
            class="eco-btn-outlined px-3 py-1.5 text-xs"
          >
            ⬇ Export CSV
          </button>
        }
      </div>

      @if (!readings.length) {
        <div class="py-10 text-center text-gray-400 text-sm">
          No readings to display.
        </div>
      } @else {
        <div class="overflow-x-auto">
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
                  <td class="font-mono text-xs text-gray-600">
                    {{ r.recorded_at | date: 'dd MMM yyyy, HH:mm' }}
                  </td>
                  <td>
                    <span class="eco-badge-info">{{ r.metric }}</span>
                  </td>
                  <td class="font-semibold text-gray-900">
                    {{ r.value | number: '1.2-4' }}
                  </td>
                  <td class="text-gray-500">{{ r.unit }}</td>
                  <td class="text-gray-400 text-xs">{{ r.source ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div
            class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100"
          >
            <span class="text-xs text-gray-500">
              Showing {{ (page() - 1) * pageSize + 1 }}–{{
                min(page() * pageSize, readings.length)
              }}
              of {{ readings.length }}
            </span>
            <div class="flex items-center gap-1">
              <button
                (click)="setPage(page() - 1)"
                [disabled]="page() === 1"
                class="eco-btn-outlined px-3 py-1.5 text-xs disabled:opacity-40"
              >
                ← Prev
              </button>
              @for (p of pageRange(); track p) {
                <button
                  (click)="setPage(p)"
                  [class]="
                    p === page()
                      ? 'eco-btn-primary px-3 py-1.5 text-xs'
                      : 'eco-btn-outlined px-3 py-1.5 text-xs'
                  "
                >
                  {{ p }}
                </button>
              }
              <button
                (click)="setPage(page() + 1)"
                [disabled]="page() === totalPages()"
                class="eco-btn-outlined px-3 py-1.5 text-xs disabled:opacity-40"
              >
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
