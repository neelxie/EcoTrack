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
  <div class="eco-card" style="padding:0;overflow:hidden;">

    <!-- Toolbar -->
    <div style="padding:1rem 1.5rem;border-bottom:1px solid #f3f4f6;
                display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;">
      <div style="flex:1;min-width:200px;position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);
                     color:#9ca3af;font-size:0.875rem;">🔍</span>
        <input [formControl]="searchCtrl"
               class="eco-input"
               style="padding-left:2rem;"
               placeholder="Search by name, city, country…" />
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
        <select [formControl]="typeCtrl" class="eco-input" style="width:auto;">
          <option value="">All types</option>
          <option value="air_quality">Air quality</option>
          <option value="weather">Weather</option>
          <option value="emissions">Emissions</option>
        </select>
        <button (click)="toggleActive()"
                [class]="activeOnly() ? 'eco-btn-primary' : 'eco-btn-outlined'">
          {{ activeOnly() ? '✅ Active only' : 'All stations' }}
        </button>
        <button (click)="addClicked.emit()" class="eco-btn-secondary">
          + Add station
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    @if (loading()) {
      <div style="padding:1rem 1.5rem;display:flex;flex-direction:column;gap:0.75rem;">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="eco-skeleton" style="height:44px;border-radius:8px;"></div>
        }
      </div>
    }

    <!-- Table -->
    @if (!loading()) {
      <div style="overflow-x:auto;">
        <table class="eco-table">
          <thead>
            <tr>
              <th>
                <button (click)="sort('name')"
                        style="background:none;border:none;cursor:pointer;
                               font:inherit;color:inherit;display:flex;align-items:center;gap:4px;">
                  Name {{ sortIndicator('name') }}
                </button>
              </th>
              <th>Location</th>
              <th>Type</th>
              <th>Coordinates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (station of stations(); track station.id) {
              <tr style="cursor:pointer;" (click)="rowClicked.emit(station)">
                <td style="font-weight:500;color:#111827;">{{ station.name }}</td>
                <td style="color:#6b7280;">{{ station.city }}, {{ station.country }}</td>
                <td>
                  <span [class]="typeBadge(station.type)">
                    {{ station.type.replace('_',' ') }}
                  </span>
                </td>
                <td style="font-family:monospace;font-size:0.75rem;color:#9ca3af;">
                  {{ station.latitude | number:'1.4-4' }},
                  {{ station.longitude | number:'1.4-4' }}
                </td>
                <td>
                  @if (station.is_active) {
                    <span class="eco-badge eco-badge-success">Active</span>
                  } @else {
                    <span class="eco-badge eco-badge-error">Inactive</span>
                  }
                </td>
                <td (click)="$event.stopPropagation()">
                  <div style="display:flex;align-items:center;gap:4px;">
                    <button (click)="editClicked.emit(station)"
                            style="padding:6px;border-radius:6px;border:none;
                                   background:transparent;cursor:pointer;font-size:1rem;
                                   color:#6b7280;transition:background 0.15s;"
                            onmouseover="this.style.background='#eff6ff'"
                            onmouseout="this.style.background='transparent'"
                            title="Edit">✏️</button>
                    <button (click)="confirmDelete(station)"
                            style="padding:6px;border-radius:6px;border:none;
                                   background:transparent;cursor:pointer;font-size:1rem;
                                   color:#6b7280;transition:background 0.15s;"
                            onmouseover="this.style.background='#fef2f2'"
                            onmouseout="this.style.background='transparent'"
                            title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="eco-empty">
                    <span class="eco-empty-icon">📭</span>
                    <p class="eco-empty-title">No stations found</p>
                    <p style="margin:4px 0 0;">
                      Try adjusting your search or
                      <button (click)="addClicked.emit()"
                              style="background:none;border:none;color:#1565c0;
                                     cursor:pointer;font:inherit;font-weight:500;">
                        add a new one
                      </button>
                    </p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:0.75rem 1.5rem;border-top:1px solid #f3f4f6;">
          <span style="font-size:0.75rem;color:#9ca3af;">
            Page {{ currentPage() }} of {{ totalPages() }} · {{ total() }} stations
          </span>
          <div style="display:flex;gap:4px;">
            <button (click)="setPage(currentPage()-1)"
                    [disabled]="currentPage()===1"
                    class="eco-btn-outlined"
                    style="padding:4px 10px;font-size:0.75rem;">← Prev</button>
            @for (p of pageRange(); track p) {
              <button (click)="setPage(p)"
                      [class]="p===currentPage() ? 'eco-btn-primary' : 'eco-btn-outlined'"
                      style="padding:4px 10px;font-size:0.75rem;">{{ p }}</button>
            }
            <button (click)="setPage(currentPage()+1)"
                    [disabled]="currentPage()===totalPages()"
                    class="eco-btn-outlined"
                    style="padding:4px 10px;font-size:0.75rem;">Next →</button>
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
