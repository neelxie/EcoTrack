import {
  Component, Input, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingSummary } from '../../../../core/models';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eco-card" style="padding:0;overflow:hidden;">

      <!-- Table header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:1rem 1.5rem;border-bottom:1px solid #F1F5F9;">
        <h2 style="font-size:0.875rem;font-weight:600;color:#374151;margin:0;">
          Daily averages
          @if (data.length) {
            <span class="eco-badge-info" style="margin-left:8px;">{{ data.length }}</span>
          }
        </h2>
        @if (data.length) {
          <div style="display:flex;align-items:center;gap:8px;">
            <label class="eco-label" style="margin:0;">Group by</label>
            <select (change)="setGroupBy($any($event.target).value)"
                    class="eco-input" style="width:auto;padding:4px 8px;font-size:0.8rem;">
              <option value="none">None</option>
              <option value="metric">Metric</option>
              <option value="station">Station</option>
            </select>
          </div>
        }
      </div>

      @if (!data.length) {
        <div style="padding:48px;text-align:center;color:#CBD5E1;">
          <span style="font-size:2.5rem;">📭</span>
          <p style="font-size:0.875rem;margin:12px 0 0;">No data for this selection.</p>
        </div>
      }

      @if (data.length) {
        <div style="overflow-x:auto;">
          <table class="eco-table">
            <thead>
              <tr>
                <th>
                  <button (click)="sort('station_id')" style="background:none;border:none;
                          cursor:pointer;font:inherit;color:inherit;display:flex;align-items:center;gap:4px;">
                    Station {{ indicator('station_id') }}
                  </button>
                </th>
                <th>
                  <button (click)="sort('metric')" style="background:none;border:none;
                          cursor:pointer;font:inherit;color:inherit;display:flex;align-items:center;gap:4px;">
                    Metric {{ indicator('metric') }}
                  </button>
                </th>
                <th>Unit</th>
                <th>
                  <button (click)="sort('date')" style="background:none;border:none;
                          cursor:pointer;font:inherit;color:inherit;display:flex;align-items:center;gap:4px;">
                    Date {{ indicator('date') }}
                  </button>
                </th>
                <th style="text-align:right;">
                  <button (click)="sort('avg')" style="background:none;border:none;
                          cursor:pointer;font:inherit;color:inherit;display:flex;align-items:center;gap:4px;margin-left:auto;">
                    Avg {{ indicator('avg') }}
                  </button>
                </th>
                <th style="text-align:right;color:#1565C0;">Min</th>
                <th style="text-align:right;color:#C62828;">Max</th>
              </tr>
            </thead>
            <tbody>
              @for (row of paginated(); track row.date + row.station_id + row.metric) {
                <tr>
                  <td>
                    <span style="font-weight:500;color:#0f172a;">
                      {{ stationNames[row.station_id] ?? 'Station ' + row.station_id }}
                    </span>
                  </td>
                  <td><span class="eco-badge-info">{{ row.metric }}</span></td>
                  <td style="color:#94A3B8;">{{ row.unit }}</td>
                  <td style="font-variant-numeric:tabular-nums;color:#64748B;">{{ row.date }}</td>
                  <td style="text-align:right;font-weight:600;color:#0f172a;">
                    {{ row.avg | number:'1.2-2' }}
                  </td>
                  <td style="text-align:right;color:#1565C0;">{{ row.min | number:'1.2-2' }}</td>
                  <td style="text-align:right;color:#C62828;">{{ row.max | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:12px 24px;border-top:1px solid #F1F5F9;">
            <span style="font-size:0.75rem;color:#94A3B8;">
              {{ (page()-1)*pageSize+1 }}–{{ [page()*pageSize, data.length] | min }}
              of {{ data.length }}
            </span>
            <div style="display:flex;gap:4px;">
              <button (click)="setPage(page()-1)" [disabled]="page()===1"
                      class="eco-btn-outlined" style="padding:4px 10px;font-size:0.75rem;">←</button>
              @for (p of pageRange(); track p) {
                <button (click)="setPage(p)"
                        [class]="p===page() ? 'eco-btn-primary' : 'eco-btn-outlined'"
                        style="padding:4px 10px;font-size:0.75rem;">{{ p }}</button>
              }
              <button (click)="setPage(page()+1)" [disabled]="page()===totalPages()"
                      class="eco-btn-outlined" style="padding:4px 10px;font-size:0.75rem;">→</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  // Pipe for min — handled in component
})
export class ReportTableComponent {
  @Input() set data(val: ReadingSummary[]) {
    this._data = val;
    this.page.set(1);
    this.applySort();
  }
  get data() { return this._data; }

  @Input() stationNames: Record<number, string> = {};

  private _data:    ReadingSummary[] = [];
  private sorted:   ReadingSummary[] = [];

  page       = signal(1);
  pageSize   = 20;
  sortField  = signal('date');
  sortDir    = signal<'asc'|'desc'>('asc');
  groupBy    = signal<'none'|'metric'|'station'>('none');

  totalPages = computed(() => Math.ceil(this.sorted.length / this.pageSize));

  paginated = computed(() => {
    const s = (this.page() - 1) * this.pageSize;
    return this.sorted.slice(s, s + this.pageSize);
  });

  sort(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.applySort();
    this.page.set(1);
  }

  indicator(f: string) {
    if (this.sortField() !== f) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  setGroupBy(v: 'none'|'metric'|'station') {
    this.groupBy.set(v);
    this.applySort();
    this.page.set(1);
  }

  private applySort() {
    const field = this.sortField() as keyof ReadingSummary;
    const dir   = this.sortDir() === 'asc' ? 1 : -1;

    this.sorted = [...this._data].sort((a, b) => {
      // Group-by takes precedence
      const gb = this.groupBy();
      if (gb === 'metric') {
        const cmp = a.metric.localeCompare(b.metric);
        if (cmp !== 0) return cmp;
      }
      if (gb === 'station') {
        if (a.station_id !== b.station_id) return (a.station_id - b.station_id);
      }
      const av = a[field], bv = b[field];
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * dir;
    });
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  pageRange(): number[] {
    const cur = this.page(), total = this.totalPages();
    const s   = Math.max(1, cur - 2);
    const e   = Math.min(total, cur + 2);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }
}