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
        <div class="eco-modal-header">
          <h2 class="eco-modal-title">
            {{ isEdit() ? 'Edit station' : 'Add new station' }}
          </h2>
          <button (click)="cancel.emit()" class="eco-modal-close">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="eco-modal-body">
            <div class="eco-form-grid">
              <div class="eco-form-field span-2">
                <label class="eco-label">Station name *</label>
                <input
                  formControlName="name"
                  class="eco-input"
                  placeholder="e.g. Kampala Central Monitor"
                />
                @if (f['name'].touched && f['name'].invalid) {
                  <span class="eco-field-error">Name is required.</span>
                }
              </div>

              <div class="eco-form-field">
                <label class="eco-label">Country *</label>
                <input
                  formControlName="country"
                  class="eco-input"
                  placeholder="Uganda"
                />
                @if (f['country'].touched && f['country'].invalid) {
                  <span class="eco-field-error">Required.</span>
                }
              </div>

              <div class="eco-form-field">
                <label class="eco-label">City *</label>
                <input
                  formControlName="city"
                  class="eco-input"
                  placeholder="Kampala"
                />
                @if (f['city'].touched && f['city'].invalid) {
                  <span class="eco-field-error">Required.</span>
                }
              </div>

              <div class="eco-form-field">
                <label class="eco-label">Latitude *</label>
                <input
                  formControlName="latitude"
                  type="number"
                  step="any"
                  class="eco-input"
                  placeholder="0.3476"
                />
                @if (f['latitude'].touched && f['latitude'].invalid) {
                  <span class="eco-field-error"
                    >Valid latitude (−90 to 90).</span
                  >
                }
              </div>

              <div class="eco-form-field">
                <label class="eco-label">Longitude *</label>
                <input
                  formControlName="longitude"
                  type="number"
                  step="any"
                  class="eco-input"
                  placeholder="32.5825"
                />
                @if (f['longitude'].touched && f['longitude'].invalid) {
                  <span class="eco-field-error"
                    >Valid longitude (−180 to 180).</span
                  >
                }
              </div>

              <div class="eco-form-field">
                <label class="eco-label">Station type *</label>
                <select formControlName="type" class="eco-input">
                  <option value="">Select type</option>
                  <option value="air_quality">Air quality</option>
                  <option value="weather">Weather</option>
                  <option value="emissions">Emissions</option>
                </select>
                @if (f['type'].touched && f['type'].invalid) {
                  <span class="eco-field-error">Required.</span>
                }
              </div>

              <div
                class="eco-form-field"
                style="justify-content:flex-end;padding-bottom:4px;"
              >
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

            @if (serverError()) {
              <div class="eco-alert eco-alert-error" style="margin-top:1rem;">
                {{ serverError() }}
              </div>
            }
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
              {{ isEdit() ? 'Save changes' : 'Create station' }}
            </button>
          </div>
        </form>
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
