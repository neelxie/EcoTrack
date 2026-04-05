import {
  Component, OnInit, OnDestroy,
  Input, Output, EventEmitter, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Station } from '../../../../core/models';

export interface ReportFilter {
  stationIds: number[];
  metric:     string;
  from:       string;
  to:         string;
}

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eco-card">
      <h2 style="font-size:0.875rem;font-weight:600;color:#374151;margin:0 0 1rem;">
        Report parameters
      </h2>

      <form [formGroup]="form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;">

        <!-- Station multi-select -->
        <div style="grid-column: span 2;">
          <label class="eco-label">Stations</label>
          <div style="border:1.5px solid #E2E8F0;border-radius:8px;
                      max-height:130px;overflow-y:auto;background:#fff;padding:4px;">
            @for (s of stations; track s.id) {
              <label style="display:flex;align-items:center;gap:8px;
                            padding:5px 8px;border-radius:6px;cursor:pointer;font-size:0.875rem;
                            transition:background 0.1s;"
                     [style.background]="isSelected(s.id) ? '#EFF6FF' : 'transparent'">
                <input type="checkbox"
                       [checked]="isSelected(s.id)"
                       (change)="toggleStation(s.id)"
                       style="accent-color:#1565C0;width:14px;height:14px;" />
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  {{ s.name }}
                </span>
                <span class="eco-badge-neutral" style="font-size:0.65rem;">{{ s.type }}</span>
              </label>
            }
            @if (!stations.length) {
              <p style="padding:8px;color:#94A3B8;font-size:0.8rem;">No stations available.</p>
            }
          </div>
          <p style="font-size:0.7rem;color:#94A3B8;margin-top:4px;">
            {{ selectedIds().length }} selected
          </p>
        </div>

        <!-- Metric -->
        <div>
          <label class="eco-label">Metric</label>
          <input formControlName="metric"
                 list="report-metrics"
                 class="eco-input"
                 placeholder="All metrics" />
          <datalist id="report-metrics">
            @for (m of commonMetrics; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </datalist>
        </div>

        <!-- From -->
        <div>
          <label class="eco-label">From</label>
          <input type="date" formControlName="from" class="eco-input" />
        </div>

        <!-- To -->
        <div>
          <label class="eco-label">To</label>
          <input type="date" formControlName="to" class="eco-input" />
        </div>

      </form>

      <!-- Quick range pills -->
      <div style="display:flex;align-items:center;gap:8px;margin-top:1rem;flex-wrap:wrap;">
        <span style="font-size:0.75rem;font-weight:500;color:#64748B;">Quick range:</span>
        @for (r of quickRanges; track r.label) {
          <button
            (click)="applyRange(r.days)"
            [class]="activeRange() === r.days ? 'eco-btn-primary' : 'eco-btn-outlined'"
            style="padding:4px 12px;font-size:0.75rem;">
            {{ r.label }}
          </button>
        }
        <button (click)="selectAll()" class="eco-btn-ghost"
                style="padding:4px 12px;font-size:0.75rem;">
          Select all stations
        </button>
        <button (click)="clearAll()" class="eco-btn-ghost"
                style="padding:4px 12px;font-size:0.75rem;">
          Clear
        </button>
      </div>
    </div>
  `,
})
export class ReportFiltersComponent implements OnInit, OnDestroy {
  @Input()  stations: Station[] = [];
  @Output() filterChange = new EventEmitter<ReportFilter>();

  form!:       FormGroup;
  selectedIds  = signal<number[]>([]);
  activeRange  = signal(7);
  private destroy$ = new Subject<void>();

  commonMetrics = ['pm25','pm10','co2','no2','o3','so2','temperature','humidity','pressure'];
  quickRanges   = [
    { label: '7 days',  days: 7  },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
    { label: '1 year',  days: 365},
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      metric: [''],
      from:   [this.daysAgo(7)],
      to:     [this.today()],
    });

    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$),
    ).subscribe(() => this.emit());
  }

  isSelected(id: number) { return this.selectedIds().includes(id); }

  toggleStation(id: number) {
    this.selectedIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
    this.emit();
  }

  selectAll() {
    this.selectedIds.set(this.stations.map(s => s.id));
    this.emit();
  }

  clearAll() {
    this.selectedIds.set([]);
    this.emit();
  }

  applyRange(days: number) {
    this.activeRange.set(days);
    this.form.patchValue({ from: this.daysAgo(days), to: this.today() });
  }

  private emit() {
    this.filterChange.emit({
      stationIds: this.selectedIds(),
      metric:     this.form.value.metric || '',
      from:       this.form.value.from,
      to:         this.form.value.to,
    });
  }

  private today()       { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}