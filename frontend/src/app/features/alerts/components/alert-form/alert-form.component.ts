import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Station, Alert } from '../../../../core/models';

export type AlertPayload = {
  station_id: number;
  metric: string;
  operator: any;
  threshold: number;
  is_active: boolean;
};

@Component({
  selector: 'app-alert-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
                flex items-center justify-center p-4"
      (click)="onBackdrop($event)"
    >
      <div
        class="relative w-full max-w-md bg-white rounded-2xl shadow-elevated z-50"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
        >
          <h2 class="text-base font-semibold text-gray-900">
            {{ isEdit() ? 'Edit alert rule' : 'New alert rule' }}
          </h2>
          <button
            (click)="cancel.emit()"
            class="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100
                         transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Form -->
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="px-6 py-5 space-y-4"
        >
          <!-- Station -->
          <div>
            <label class="eco-label">Station *</label>
            <select formControlName="station_id" class="eco-input">
              <option [ngValue]="null">Select a station</option>
              @for (s of stations; track s.id) {
                <option [ngValue]="s.id">{{ s.name }} — {{ s.city }}</option>
              }
            </select>
            @if (f['station_id'].touched && f['station_id'].invalid) {
              <p class="text-xs text-red-500 mt-1">Please select a station.</p>
            }
          </div>

          <!-- Metric -->
          <div>
            <label class="eco-label">Metric *</label>
            <input
              formControlName="metric"
              list="alert-metrics"
              class="eco-input"
              placeholder="e.g. pm25, temperature, co2"
            />
            <datalist id="alert-metrics">
              @for (m of commonMetrics; track m) {
                <option [value]="m">{{ m }}</option>
              }
            </datalist>
            @if (f['metric'].touched && f['metric'].invalid) {
              <p class="text-xs text-red-500 mt-1">Metric is required.</p>
            }
          </div>

          <!-- Operator + Threshold side by side -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="eco-label">Condition *</label>
              <select formControlName="operator" class="eco-input">
                <option value="">Select</option>
                <option value="gt">Greater than (&gt;)</option>
                <option value="gte">At least (≥)</option>
                <option value="lt">Less than (&lt;)</option>
                <option value="lte">At most (≤)</option>
                <option value="eq">Equal to (=)</option>
              </select>
              @if (f['operator'].touched && f['operator'].invalid) {
                <p class="text-xs text-red-500 mt-1">Condition required.</p>
              }
            </div>

            <div>
              <label class="eco-label">Threshold *</label>
              <input
                formControlName="threshold"
                type="number"
                step="any"
                class="eco-input"
                placeholder="e.g. 150"
              />
              @if (f['threshold'].touched && f['threshold'].invalid) {
                <p class="text-xs text-red-500 mt-1">Enter a number.</p>
              }
            </div>
          </div>

          <!-- Preview sentence -->
          @if (
            form.value.metric &&
            form.value.operator &&
            form.value.threshold !== null
          ) {
            <div
              class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800"
            >
              🔔 Trigger when
              <strong>{{ form.value.metric }}</strong>
              {{ operatorLabel(form.value.operator) }}
              <strong>{{ form.value.threshold }}</strong>
              at
              <strong>{{ stationName(form.value.station_id) }}</strong>
            </div>
          }

          <!-- Active toggle -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="toggleActive()"
              [class]="form.value.is_active ? 'bg-secondary' : 'bg-gray-300'"
              class="relative w-11 h-6 rounded-full transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1"
            >
              <span
                [class]="
                  form.value.is_active ? 'translate-x-6' : 'translate-x-1'
                "
                class="block w-4 h-4 bg-white rounded-full shadow
                           transition-transform duration-200"
              ></span>
            </button>
            <span class="text-sm text-gray-700">
              {{ form.value.is_active ? 'Alert active' : 'Alert paused' }}
            </span>
          </div>

          <!-- Server error -->
          @if (serverError()) {
            <div
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ serverError() }}
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="cancel.emit()"
              class="eco-btn-outlined"
            >
              Cancel
            </button>
            <button type="submit" [disabled]="saving()" class="eco-btn-primary">
              @if (saving()) {
                <span class="flex items-center gap-2">
                  <svg
                    class="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Saving…
                </span>
              } @else {
                {{ isEdit() ? 'Save changes' : 'Create alert' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AlertFormComponent implements OnInit {
  @Input() stations: Station[] = [];
  @Input() alert: Alert | null = null;
  @Output() saved = new EventEmitter<AlertPayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  saving = signal(false);
  serverError = signal('');
  isEdit = computed(() => !!this.alert);

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

  operators: Record<string, string> = {
    gt: 'is greater than',
    gte: 'is at least',
    lt: 'is less than',
    lte: 'is at most',
    eq: 'equals',
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      station_id: [this.alert?.station_id ?? null, Validators.required],
      metric: [this.alert?.metric ?? '', Validators.required],
      operator: [this.alert?.operator ?? '', Validators.required],
      threshold: [
        this.alert?.threshold ?? null,
        [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)],
      ],
      is_active: [this.alert?.is_active ?? true],
    });
  }

  get f() {
    return this.form.controls;
  }

  toggleActive() {
    this.form.patchValue({ is_active: !this.form.value.is_active });
  }

  operatorLabel(op: string): string {
    return this.operators[op] ?? op;
  }

  stationName(id: number): string {
    return this.stations.find((s) => s.id === id)?.name ?? '—';
  }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement) === e.currentTarget) this.cancel.emit();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');
    this.saved.emit(this.form.value as AlertPayload);
  }

  setSaving(v: boolean) {
    this.saving.set(v);
  }
  setError(msg: string) {
    this.serverError.set(msg);
    this.saving.set(false);
  }
}
