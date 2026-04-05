import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Station } from '../../../../core/models';

export interface ReadingFilter {
  stationId: number | null;
  metric: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-readings-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eco-card">
      <h2 class="eco-section-title" style="margin-bottom:1rem;">
        Filter readings
      </h2>
      <form
        [formGroup]="form"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;"
      >
        <div class="eco-form-field">
          <label class="eco-label">Station</label>
          <select formControlName="stationId" class="eco-input">
            <option [ngValue]="null">Select a station</option>
            @for (s of stations; track s.id) {
              <option [ngValue]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>
        <div class="eco-form-field">
          <label class="eco-label">Metric</label>
          <input
            formControlName="metric"
            list="metric-options"
            class="eco-input"
            placeholder="e.g. pm25, temperature"
          />
          <datalist id="metric-options">
            @for (m of commonMetrics; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </datalist>
        </div>
        <div class="eco-form-field">
          <label class="eco-label">From</label>
          <input type="date" formControlName="from" class="eco-input" />
        </div>
        <div class="eco-form-field">
          <label class="eco-label">To</label>
          <input type="date" formControlName="to" class="eco-input" />
        </div>
      </form>
      <div
        style="display:flex;align-items:center;gap:8px;margin-top:1rem;flex-wrap:wrap;"
      >
        <span class="eco-meta" style="font-weight:500;">Quick range:</span>
        @for (range of quickRanges; track range.label) {
          <button
            (click)="applyRange(range.days)"
            [class]="
              activeRange() === range.days
                ? 'eco-btn-primary'
                : 'eco-btn-outlined'
            "
            style="padding:4px 12px;font-size:0.75rem;"
          >
            {{ range.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ReadingsFiltersComponent implements OnInit, OnDestroy {
  @Input() stations: Station[] = [];
  @Output() filterChange = new EventEmitter<ReadingFilter>();

  form!: FormGroup;
  activeRange = signal(7);
  private destroy$ = new Subject<void>();

  commonMetrics = [
    'pm25',
    'pm10',
    'co2',
    'no2',
    'o3',
    'so2',
    'temperature',
    'humidity',
    'pressure',
  ];

  quickRanges = [
    { label: '24 h', days: 1 },
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      stationId: [null],
      metric: [''],
      from: [this.daysAgo(7)],
      to: [this.today()],
    });

    this.form.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe((val) => this.filterChange.emit(val));

    // Emit initial value
    this.filterChange.emit(this.form.value);
  }

  applyRange(days: number) {
    this.activeRange.set(days);
    this.form.patchValue({
      from: this.daysAgo(days),
      to: this.today(),
    });
  }

  private today() {
    return new Date().toISOString().split('T')[0];
  }
  private daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
