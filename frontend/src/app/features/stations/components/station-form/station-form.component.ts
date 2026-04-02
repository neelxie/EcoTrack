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
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      (click)="onBackdrop($event)"
    >
      <!-- Modal card -->
      <div
        class="relative w-full max-w-lg bg-white rounded-2xl shadow-elevated z-50"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
        >
          <h2 class="text-base font-semibold text-gray-900">
            {{ isEdit() ? 'Edit station' : 'Add new station' }}
          </h2>
          <button
            (click)="cancel.emit()"
            class="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="sm:col-span-2">
              <label class="eco-label">Station name *</label>
              <input
                formControlName="name"
                class="eco-input"
                placeholder="e.g. Kampala Central Monitor"
              />
              @if (f['name'].touched && f['name'].invalid) {
                <p class="text-xs text-red-500 mt-1">Name is required.</p>
              }
            </div>

            <!-- Country -->
            <div>
              <label class="eco-label">Country *</label>
              <input
                formControlName="country"
                class="eco-input"
                placeholder="Uganda"
              />
              @if (f['country'].touched && f['country'].invalid) {
                <p class="text-xs text-red-500 mt-1">Country is required.</p>
              }
            </div>

            <!-- City -->
            <div>
              <label class="eco-label">City *</label>
              <input
                formControlName="city"
                class="eco-input"
                placeholder="Kampala"
              />
              @if (f['city'].touched && f['city'].invalid) {
                <p class="text-xs text-red-500 mt-1">City is required.</p>
              }
            </div>

            <!-- Latitude -->
            <div>
              <label class="eco-label">Latitude *</label>
              <input
                formControlName="latitude"
                type="number"
                step="any"
                class="eco-input"
                placeholder="0.3476"
              />
              @if (f['latitude'].touched && f['latitude'].invalid) {
                <p class="text-xs text-red-500 mt-1">
                  Valid latitude required (−90 to 90).
                </p>
              }
            </div>

            <!-- Longitude -->
            <div>
              <label class="eco-label">Longitude *</label>
              <input
                formControlName="longitude"
                type="number"
                step="any"
                class="eco-input"
                placeholder="32.5825"
              />
              @if (f['longitude'].touched && f['longitude'].invalid) {
                <p class="text-xs text-red-500 mt-1">
                  Valid longitude required (−180 to 180).
                </p>
              }
            </div>

            <!-- Type -->
            <div>
              <label class="eco-label">Station type *</label>
              <select formControlName="type" class="eco-input">
                <option value="">Select type</option>
                <option value="air_quality">Air quality</option>
                <option value="weather">Weather</option>
                <option value="emissions">Emissions</option>
              </select>
              @if (f['type'].touched && f['type'].invalid) {
                <p class="text-xs text-red-500 mt-1">Type is required.</p>
              }
            </div>

            <!-- Active toggle -->
            <div class="flex items-center gap-3 pt-5">
              <button
                type="button"
                (click)="toggleActive()"
                [class]="form.value.is_active ? 'bg-secondary' : 'bg-gray-300'"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1"
              >
                <span
                  [class]="
                    form.value.is_active ? 'translate-x-6' : 'translate-x-1'
                  "
                  class="block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                >
                </span>
              </button>
              <span class="text-sm text-gray-700">
                {{ form.value.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <!-- Error banner -->
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
                {{ isEdit() ? 'Save changes' : 'Create station' }}
              }
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
        this.station?.latitude ?? '',
        [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      longitude: [
        this.station?.longitude ?? '',
        [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      type: [this.station?.type ?? '', [Validators.required]],
      is_active: [this.station?.is_active ?? true],
    });
  }

  get f() {
    return this.form.controls;
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

  setSaving(val: boolean) {
    this.saving.set(val);
  }
  setError(msg: string) {
    this.serverError.set(msg);
    this.saving.set(false);
  }
}
