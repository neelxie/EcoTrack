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
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Filter readings</h2>

      <form
        [formGroup]="form"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <!-- Station -->
        <div>
          <label class="eco-label">Station</label>
          <select formControlName="stationId" class="eco-input">
            <option [ngValue]="null">Select a station</option>
            @for (s of stations; track s.id) {
              <option [ngValue]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>

        <!-- Metric -->
        <div>
          <label class="eco-label">Metric</label>
          <div class="relative">
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
      <div class="flex items-center gap-2 mt-4 flex-wrap">
        <span class="text-xs text-gray-500 font-medium">Quick range:</span>
        @for (range of quickRanges; track range.label) {
          <button
            (click)="applyRange(range.days)"
            [class]="
              activeRange() === range.days
                ? 'eco-btn-primary px-3 py-1 text-xs'
                : 'eco-btn-outlined px-3 py-1 text-xs'
            "
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
