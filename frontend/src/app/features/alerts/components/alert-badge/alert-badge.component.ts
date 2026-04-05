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
      [routerLink]="['/alerts']"
      routerLinkActive="active"
      class="nav-link"
      style="position:relative;"
    >
      <span class="nav-icon">🔔</span>
      Alerts
      @if (count() > 0) {
        <span
          style="position:absolute;top:6px;left:26px;min-width:16px;height:16px;
                   padding:0 3px;background:#ef4444;color:white;font-size:10px;
                   font-weight:700;border-radius:9999px;display:flex;
                   align-items:center;justify-content:center;line-height:1;"
        >
          {{ count() > 99 ? '99+' : count() }}
        </span>
      }
    </a>

    <!-- Toasts -->
    <div
      style="position:fixed;top:1rem;right:1rem;z-index:50;
              display:flex;flex-direction:column;gap:8px;pointer-events:none;"
    >
      @for (toast of toasts(); track toast.id) {
        <div
          style="pointer-events:auto;display:flex;align-items:flex-start;gap:12px;
                  background:white;border:1px solid #fecaca;border-radius:12px;
                  box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:12px 16px;
                  max-width:320px;animation:slide-in-right 0.25s ease-out;"
        >
          <span style="color:#ef4444;font-size:1.1rem;margin-top:1px;">⚠️</span>
          <div style="flex:1;min-width:0;">
            <p
              style="font-size:0.875rem;font-weight:600;color:#111827;margin:0;"
            >
              Alert triggered
            </p>
            <p
              style="font-size:0.75rem;color:#6b7280;margin:2px 0 0;
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            >
              {{ toast.station?.name }} — {{ toast.metric }}
              {{ toast.operator }} {{ toast.threshold }}
            </p>
          </div>
          <button
            (click)="dismissToast(toast.id)"
            style="background:none;border:none;cursor:pointer;
                       color:#d1d5db;font-size:0.75rem;padding:0;"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in-right {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
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
