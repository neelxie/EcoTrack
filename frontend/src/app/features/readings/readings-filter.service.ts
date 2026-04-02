import { Injectable, signal, computed } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  switchMap,
  distinctUntilChanged,
  shareReplay,
  debounceTime,
  tap,
  map,
} from 'rxjs';
import { ReadingService } from '../../core/services/reading.service';
import { Reading, ReadingSummary } from '../../core/models';
import { format, subDays } from 'date-fns';

export interface ReadingFilters {
  stationId: number | null;
  metric: string;
  from: string;
  to: string;
}

@Injectable()
export class ReadingsFilterService {
  // ── Filter state ────────────────────────────────────────────────────────────
  private readonly _filters$ = new BehaviorSubject<ReadingFilters>({
    stationId: null,
    metric: '',
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  readonly filters$ = this._filters$.asObservable();
  readonly filters = () => this._filters$.value;

  // ── Loading flags ────────────────────────────────────────────────────────────
  loading = signal(false);
  loadingSummary = signal(false);

  // ── Derived streams ─────────────────────────────────────────────────────────
  readonly readings$: Observable<Reading[]>;
  readonly summary$: Observable<ReadingSummary[]>;

  constructor(private readingSvc: ReadingService) {
    this.readings$ = this._filters$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => this.loading.set(true)),
      switchMap((f) => {
        if (!f.stationId) {
          this.loading.set(false);
          return [
            {
              data: [] as Reading[],
              current_page: 1,
              last_page: 1,
              per_page: 100,
              total: 0,
            },
          ];
        }
        return this.readingSvc.list(f.stationId, {
          metric: f.metric || undefined,
          from: f.from,
          to: f.to,
        });
      }),
      tap(() => this.loading.set(false)),
      map((res) => res.data),
      shareReplay(1),
    );

    this.summary$ = this._filters$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => this.loadingSummary.set(true)),
      switchMap((f) => {
        if (!f.stationId) {
          this.loadingSummary.set(false);
          return [[] as ReadingSummary[]];
        }
        return this.readingSvc.summary(f.stationId, f.from, f.to);
      }),
      tap(() => this.loadingSummary.set(false)),
      shareReplay(1),
    );
  }

  patch(partial: Partial<ReadingFilters>) {
    this._filters$.next({ ...this._filters$.value, ...partial });
  }

  setStation(stationId: number | null) {
    this.patch({ stationId, metric: '' });
  }
  setMetric(metric: string) {
    this.patch({ metric });
  }
  setDateRange(from: string, to: string) {
    this.patch({ from, to });
  }

  // Quick-range helpers
  setLastN(days: number) {
    this.setDateRange(
      format(subDays(new Date(), days), 'yyyy-MM-dd'),
      format(new Date(), 'yyyy-MM-dd'),
    );
  }
}
