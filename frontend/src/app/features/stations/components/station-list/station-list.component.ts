import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  signal,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Subject,
  combineLatest,
  BehaviorSubject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
  map,
  tap,
} from 'rxjs';
import { StationService } from '../../../../core/services/station.service';
import { Station, PaginatedResponse } from '../../../../core/models';

@Component({
  selector: 'app-station-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="eco-card">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div class="flex-1 relative">
          <span
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            >🔍</span
          >
          <input
            [formControl]="searchCtrl"
            class="eco-input pl-8"
            placeholder="Search by name, city, country…"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Type filter -->
          <select [formControl]="typeCtrl" class="eco-input w-auto">
            <option value="">All types</option>
            <option value="air_quality">Air quality</option>
            <option value="weather">Weather</option>
            <option value="emissions">Emissions</option>
          </select>

          <!-- Active filter -->
          <button
            (click)="toggleActive()"
            [class]="activeOnly() ? 'eco-btn-primary' : 'eco-btn-outlined'"
            class="whitespace-nowrap"
          >
            {{ activeOnly() ? '✅ Active' : 'All' }}
          </button>

          <!-- Add -->
          <button
            (click)="addClicked.emit()"
            class="eco-btn-secondary whitespace-nowrap"
          >
            + Add station
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          }
        </div>
      }

      <!-- Table -->
      @if (!loading()) {
        <div class="overflow-x-auto">
          <table class="eco-table">
            <thead>
              <tr>
                <th>
                  <button
                    (click)="sort('name')"
                    class="flex items-center gap-1 hover:text-primary"
                  >
                    Name {{ sortIndicator('name') }}
                  </button>
                </th>
                <th>Location</th>
                <th>
                  <button
                    (click)="sort('type')"
                    class="flex items-center gap-1 hover:text-primary"
                  >
                    Type {{ sortIndicator('type') }}
                  </button>
                </th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (station of stations(); track station.id) {
                <tr class="cursor-pointer" (click)="rowClicked.emit(station)">
                  <td class="font-medium text-gray-900">{{ station.name }}</td>
                  <td class="text-gray-600">
                    {{ station.city }}, {{ station.country }}
                  </td>
                  <td>
                    <span class="eco-badge" [class]="typeBadge(station.type)">
                      {{ station.type.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="text-gray-500 font-mono text-xs">
                    {{ station.latitude | number: '1.4-4' }},
                    {{ station.longitude | number: '1.4-4' }}
                  </td>
                  <td>
                    @if (station.is_active) {
                      <span class="eco-badge-success">Active</span>
                    } @else {
                      <span class="eco-badge-error">Inactive</span>
                    }
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="flex items-center gap-1">
                      <button
                        (click)="editClicked.emit(station)"
                        class="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500
                                     hover:text-primary transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        (click)="confirmDelete(station)"
                        class="p-1.5 rounded-lg hover:bg-red-50 text-gray-500
                                     hover:text-error transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="6"
                    class="text-center py-10 text-gray-400 text-sm"
                  >
                    No stations found. Try adjusting your search or
                    <button
                      (click)="addClicked.emit()"
                      class="text-primary hover:underline"
                    >
                      add a new one</button
                    >.
                  </td>
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
              Page {{ currentPage() }} of {{ totalPages() }} ·
              {{ total() }} stations
            </span>
            <div class="flex items-center gap-1">
              <button
                (click)="setPage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
                class="eco-btn-outlined px-3 py-1.5 text-xs disabled:opacity-40"
              >
                ← Prev
              </button>
              @for (p of pageRange(); track p) {
                <button
                  (click)="setPage(p)"
                  [class]="
                    p === currentPage()
                      ? 'eco-btn-primary px-3 py-1.5 text-xs'
                      : 'eco-btn-outlined px-3 py-1.5 text-xs'
                  "
                >
                  {{ p }}
                </button>
              }
              <button
                (click)="setPage(currentPage() + 1)"
                [disabled]="currentPage() === totalPages()"
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
export class StationListComponent implements OnInit, OnDestroy {
  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<Station>();
  @Output() rowClicked = new EventEmitter<Station>();
  @Output() deleted = new EventEmitter<number>();

  stations = signal<Station[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  activeOnly = signal(false);

  searchCtrl = new FormControl('');
  typeCtrl = new FormControl('');

  private sortField$ = new BehaviorSubject<string>('name');
  private sortDir$ = new BehaviorSubject<'asc' | 'desc'>('asc');
  private page$ = new BehaviorSubject<number>(1);
  private destroy$ = new Subject<void>();

  constructor(private stationSvc: StationService) {}

  ngOnInit() {
    const search$ = this.searchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => this.page$.next(1)),
    );

    const type$ = this.typeCtrl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      tap(() => this.page$.next(1)),
    );

    combineLatest([search$, type$, this.page$])
      .pipe(
        switchMap(([search, type, page]) => {
          this.loading.set(true);
          return this.stationSvc.list({
            search: search ?? undefined,
            type: type ?? undefined,
            active: this.activeOnly(),
            page,
          });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res: PaginatedResponse<Station>) => {
        this.stations.set(res.data);
        this.currentPage.set(res.current_page);
        this.totalPages.set(res.last_page);
        this.total.set(res.total);
        this.loading.set(false);
      });
  }

  toggleActive() {
    this.activeOnly.update((v) => !v);
    this.page$.next(1);
    // Re-trigger search by nudging the control
    this.searchCtrl.updateValueAndValidity({ emitEvent: true });
  }

  sort(field: string) {
    if (this.sortField$.value === field) {
      this.sortDir$.next(this.sortDir$.value === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField$.next(field);
      this.sortDir$.next('asc');
    }
    // Client-side sort on the current page
    const dir = this.sortDir$.value === 'asc' ? 1 : -1;
    this.stations.update((list) =>
      [...list].sort((a, b) => {
        const av = (a as any)[field] ?? '';
        const bv = (b as any)[field] ?? '';
        return av < bv ? -dir : av > bv ? dir : 0;
      }),
    );
  }

  sortIndicator(field: string): string {
    if (this.sortField$.value !== field) return '↕';
    return this.sortDir$.value === 'asc' ? '↑' : '↓';
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page$.next(p);
  }

  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    const delta = 2;
    const start = Math.max(1, cur - delta);
    const end = Math.min(total, cur + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  confirmDelete(station: Station) {
    if (!confirm(`Delete "${station.name}"? This cannot be undone.`)) return;
    this.stationSvc.delete(station.id).subscribe({
      next: () => {
        this.stations.update((list) => list.filter((s) => s.id !== station.id));
        this.deleted.emit(station.id);
      },
    });
  }

  typeBadge(type: string): string {
    return (
      {
        air_quality: 'eco-badge-info',
        weather: 'eco-badge-success',
        emissions: 'eco-badge-warning',
      }[type] ?? 'eco-badge-info'
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
