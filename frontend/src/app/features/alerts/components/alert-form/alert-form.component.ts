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
    <div class="eco-modal-backdrop" (click)="onBackdrop($event)">
      <div class="eco-modal" (click)="$event.stopPropagation()">
        <div class="eco-modal-header">
          <h2 class="eco-modal-title">
            {{ isEdit() ? 'Edit alert rule' : 'New alert rule' }}
          </h2>
          <button (click)="cancel.emit()" class="eco-modal-close">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="eco-modal-body">
            <div style="display:flex;flex-direction:column;gap:1rem;">
              <div class="eco-form-field">
                <label class="eco-label">Station *</label>
                <select formControlName="station_id" class="eco-input">
                  <option [ngValue]="null">Select a station</option>
                  @for (s of stations; track s.id) {
                    <option [ngValue]="s.id">
                      {{ s.name }} — {{ s.city }}
                    </option>
                  }
                </select>
                @if (f['station_id'].touched && f['station_id'].invalid) {
                  <span class="eco-field-error">Please select a station.</span>
                }
              </div>

              <div class="eco-form-field">
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
                  <span class="eco-field-error">Metric is required.</span>
                }
              </div>

              <div class="eco-form-grid">
                <div class="eco-form-field">
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
                    <span class="eco-field-error">Required.</span>
                  }
                </div>
                <div class="eco-form-field">
                  <label class="eco-label">Threshold *</label>
                  <input
                    formControlName="threshold"
                    type="number"
                    step="any"
                    class="eco-input"
                    placeholder="e.g. 150"
                  />
                  @if (f['threshold'].touched && f['threshold'].invalid) {
                    <span class="eco-field-error">Enter a number.</span>
                  }
                </div>
              </div>

              @if (
                form.value.metric &&
                form.value.operator &&
                form.value.threshold !== null
              ) {
                <div class="eco-alert eco-alert-info">
                  🔔 Trigger when <strong>{{ form.value.metric }}</strong>
                  {{ operatorLabel(form.value.operator) }}
                  <strong>{{ form.value.threshold }}</strong>
                  at <strong>{{ stationName(form.value.station_id) }}</strong>
                </div>
              }

              <div class="eco-form-field">
                <label class="eco-label">Status</label>
                <div class="eco-toggle-wrap" (click)="toggleActive()">
                  <div
                    class="eco-toggle-track"
                    [class.on]="form.value.is_active"
                  >
                    <div class="eco-toggle-thumb"></div>
                  </div>
                  <span class="eco-toggle-label">
                    {{ form.value.is_active ? 'Alert active' : 'Alert paused' }}
                  </span>
                </div>
              </div>

              @if (serverError()) {
                <div class="eco-alert eco-alert-error">{{ serverError() }}</div>
              }
            </div>
          </div>

          <div class="eco-modal-footer">
            <button
              type="button"
              (click)="cancel.emit()"
              class="eco-btn-outlined"
            >
              Cancel
            </button>
            <button type="submit" [disabled]="saving()" class="eco-btn-primary">
              @if (saving()) {
                <span class="eco-spinner"></span>
              }
              {{ isEdit() ? 'Save changes' : 'Create alert' }}
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
