import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subject, takeUntil, fromEvent, map, filter } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.services';
import { AuthService } from '../../../../core/services/auth.services';
import { Alert } from '../../../../core/models';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a
      routerLink="/alerts"
      class="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100
              hover:bg-white/10 hover:text-white transition-all duration-150 text-sm font-medium"
    >
      <span class="text-lg">🔔</span>
      Alerts
      @if (count() > 0) {
        <span
          class="absolute left-6 top-1.5 min-w-[18px] h-[18px] px-1
                     bg-red-500 text-white text-[10px] font-bold rounded-full
                     flex items-center justify-center animate-pulse"
        >
          {{ count() > 99 ? '99+' : count() }}
        </span>
      }
    </a>

    <!-- Triggered alert toasts -->
    <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      @for (toast of toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 bg-white border border-red-200
                    rounded-xl shadow-elevated px-4 py-3 max-w-xs animate-slide-in"
        >
          <span class="text-red-500 text-lg mt-0.5">⚠️</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              Alert triggered
            </p>
            <p class="text-xs text-gray-500 mt-0.5 truncate">
              {{ toast.station?.name }} — {{ toast.metric }}
              {{ toast.operator }} {{ toast.threshold }}
            </p>
          </div>
          <button
            (click)="dismissToast(toast.id)"
            class="text-gray-300 hover:text-gray-500 text-xs mt-0.5"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .animate-slide-in {
        animation: slide-in 0.25s ease-out;
      }
    `,
  ],
})
export class AlertBadgeComponent implements OnInit, OnDestroy {
  count = signal(0);
  toasts = signal<Alert[]>([]);

  private eventSource: EventSource | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private alertSvc: AlertService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) return;

    // Load initial active alert count
    this.alertSvc
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((alerts) => {
        this.count.set(alerts.filter((a) => a.is_active).length);
      });

    // Open SSE stream
    this.eventSource = this.alertSvc.streamAlerts();
    if (!this.eventSource) return;

    // Wrap EventSource in an RxJS Observable
    this.fromEventSource(this.eventSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe((triggered) => {
        // Add toasts for newly triggered alerts
        this.toasts.update((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newOnes = triggered.filter((a) => !existingIds.has(a.id));
          return [...prev, ...newOnes];
        });

        // Auto-dismiss toasts after 6 seconds
        triggered.forEach((alert) => {
          setTimeout(() => this.dismissToast(alert.id), 6000);
        });

        this.count.update((n) => n + triggered.length);
      });
  }

  private fromEventSource(es: EventSource): Observable<Alert[]> {
    return new Observable<Alert[]>((observer) => {
      es.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Alert[];
          observer.next(data);
        } catch {
          /* malformed frame — ignore */
        }
      };

      es.onerror = () => {
        // SSE auto-reconnects; don't complete the observable
      };

      return () => es.close();
    });
  }

  dismissToast(id: number) {
    this.toasts.update((prev) => prev.filter((t) => t.id !== id));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.eventSource?.close();
  }
}
