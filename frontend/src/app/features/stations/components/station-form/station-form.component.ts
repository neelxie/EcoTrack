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
import { Station } from '../../../../core/models';

@Component({
  selector: 'app-station-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eco-modal-backdrop" (click)="onBackdrop($event)">
      <div class="eco-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="eco-modal-header">
          <h2 class="eco-modal-title">
            {{ isEdit() ? 'Edit station' : 'Add new station' }}
          </h2>
          <button class="eco-modal-close" (click)="cancel.emit()" type="button">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="eco-modal-body">
          <!-- Server error -->
          @if (serverError()) {
            <div
              class="eco-alert eco-alert-error"
              style="margin-bottom:1.25rem"
            >
              <span>⚠️</span>
              <span>{{ serverError() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" id="station-form">
            <div class="eco-form-grid">
              <!-- Name -->
              <div class="eco-form-field span-2">
                <label class="eco-label">Station name *</label>
                <input
                  formControlName="name"
                  class="eco-input"
                  [class.error]="touched('name') && invalid('name')"
                  placeholder="e.g. Kampala Central Monitor"
                />
                @if (touched('name') && invalid('name')) {
                  <span class="eco-field-error"
                    >⚠ Station name is required.</span
                  >
                }
              </div>

              <!-- Country -->
              <div class="eco-form-field">
                <label class="eco-label">Country *</label>
                <input
                  formControlName="country"
                  class="eco-input"
                  [class.error]="touched('country') && invalid('country')"
                  placeholder="Uganda"
                />
                @if (touched('country') && invalid('country')) {
                  <span class="eco-field-error">⚠ Country is required.</span>
                }
              </div>

              <!-- City -->
              <div class="eco-form-field">
                <label class="eco-label">City *</label>
                <input
                  formControlName="city"
                  class="eco-input"
                  [class.error]="touched('city') && invalid('city')"
                  placeholder="Kampala"
                />
                @if (touched('city') && invalid('city')) {
                  <span class="eco-field-error">⚠ City is required.</span>
                }
              </div>

              <!-- Latitude -->
              <div class="eco-form-field">
                <label class="eco-label">Latitude *</label>
                <input
                  formControlName="latitude"
                  type="number"
                  step="any"
                  class="eco-input"
                  [class.error]="touched('latitude') && invalid('latitude')"
                  placeholder="0.3476"
                />
                @if (touched('latitude') && invalid('latitude')) {
                  <span class="eco-field-error"
                    >⚠ Valid latitude (−90 to 90) required.</span
                  >
                }
              </div>

              <!-- Longitude -->
              <div class="eco-form-field">
                <label class="eco-label">Longitude *</label>
                <input
                  formControlName="longitude"
                  type="number"
                  step="any"
                  class="eco-input"
                  [class.error]="touched('longitude') && invalid('longitude')"
                  placeholder="32.5825"
                />
                @if (touched('longitude') && invalid('longitude')) {
                  <span class="eco-field-error"
                    >⚠ Valid longitude (−180 to 180) required.</span
                  >
                }
              </div>

              <!-- Type -->
              <div class="eco-form-field">
                <label class="eco-label">Station type *</label>
                <select
                  formControlName="type"
                  class="eco-input"
                  [class.error]="touched('type') && invalid('type')"
                >
                  <option value="">Select a type…</option>
                  <option value="air_quality">Air quality</option>
                  <option value="weather">Weather</option>
                  <option value="emissions">Emissions</option>
                </select>
                @if (touched('type') && invalid('type')) {
                  <span class="eco-field-error"
                    >⚠ Please select a station type.</span
                  >
                }
              </div>

              <!-- Active toggle -->
              <div class="eco-form-field" style="justify-content:flex-end">
                <label class="eco-label">Status</label>
                <div class="eco-toggle-wrap" (click)="toggleActive()">
                  <div
                    class="eco-toggle-track"
                    [class.on]="form.value.is_active"
                  >
                    <div class="eco-toggle-thumb"></div>
                  </div>
                  <span class="eco-toggle-label">
                    {{ form.value.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="eco-modal-footer">
          <button
            type="button"
            (click)="cancel.emit()"
            class="eco-btn eco-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="station-form"
            class="eco-btn eco-btn-primary"
            [disabled]="saving()"
          >
            @if (saving()) {
              <span class="eco-spinner"></span>
              Saving…
            } @else {
              {{ isEdit() ? 'Save changes' : 'Create station' }}
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class StationFormComponent implements OnInit {
  @Input() station: Station | null = null;
  @Output() saved = new EventEmitter<Partial<Station>>();
  @Output() cancel = new EventEmitter<void>();

  saving = signal(false);
  serverError = signal('');
  form!: FormGroup;
  isEdit = computed(() => !!this.station);

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: [
        this.station?.name ?? '',
        [Validators.required, Validators.maxLength(255)],
      ],
      country: [this.station?.country ?? '', [Validators.required]],
      city: [this.station?.city ?? '', [Validators.required]],
      latitude: [
        this.station?.latitude ?? null,
        [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      longitude: [
        this.station?.longitude ?? null,
        [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      type: [this.station?.type ?? '', [Validators.required]],
      is_active: [this.station?.is_active ?? true],
    });
  }

  touched(field: string) {
    return this.form.get(field)?.touched;
  }
  invalid(field: string) {
    return this.form.get(field)?.invalid;
  }

  toggleActive() {
    this.form.patchValue({ is_active: !this.form.value.is_active });
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
    this.saved.emit(this.form.value);
  }

  setSaving(v: boolean) {
    this.saving.set(v);
  }
  setError(msg: string) {
    this.serverError.set(msg);
    this.saving.set(false);
  }
}
