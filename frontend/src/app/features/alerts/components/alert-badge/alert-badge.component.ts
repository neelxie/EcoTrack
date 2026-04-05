import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.services';
import { AuthService } from '../../../../core/services/auth.services';
import { Alert } from '../../../../core/models';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
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
      .toast-enter {
        animation: slide-in-right 0.25s ease-out;
      }
    `,
  ],
  template: `
    <a
      [routerLink]="['/alerts']"
      routerLinkActive="active"
      class="nav-link"
      style="position: relative;"
    >
      <span class="nav-icon">🔔</span>
      Alerts
      @if (count() > 0) {
        <span
          style="position:absolute;top:6px;left:28px;
                     min-width:16px;height:16px;padding:0 4px;
                     background:#ef4444;color:#fff;font-size:10px;font-weight:700;
                     border-radius:9999px;display:flex;align-items:center;
                     justify-content:center;line-height:1;"
        >
          {{ count() > 99 ? '99+' : count() }}
        </span>
      }
    </a>

    <!-- Toasts portal -->
    <div
      style="position:fixed;top:1rem;right:1rem;z-index:9999;
                display:flex;flex-direction:column;gap:8px;pointer-events:none;
                max-width:320px;"
    >
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast-enter"
          style="pointer-events:auto;display:flex;align-items:flex-start;gap:12px;
                    background:#fff;border:1px solid #fecaca;border-radius:12px;
                    box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:12px 16px;"
        >
          <span style="color:#ef4444;font-size:1.1rem;flex-shrink:0;">⚠️</span>
          <div style="flex:1;min-width:0;">
            <p
              style="font-size:0.875rem;font-weight:600;color:#111827;margin:0;"
            >
              Alert triggered
            </p>
            <p
              style="font-size:0.75rem;color:#6b7280;margin:3px 0 0;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            >
              {{ toast.station?.name ?? 'Station' }} — {{ toast.metric }}
              {{ toast.operator }} {{ toast.threshold }}
            </p>
          </div>
          <button
            (click)="dismissToast(toast.id)"
            style="background:none;border:none;cursor:pointer;
                         color:#d1d5db;font-size:0.875rem;padding:0;flex-shrink:0;"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
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

    this.alertSvc
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe((alerts) => {
        this.count.set(alerts.filter((a) => a.is_active).length);
      });

    this.eventSource = this.alertSvc.streamAlerts();
    if (!this.eventSource) return;

    this.fromEventSource(this.eventSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe((triggered) => {
        this.toasts.update((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          return [...prev, ...triggered.filter((a) => !existingIds.has(a.id))];
        });
        triggered.forEach((a) =>
          setTimeout(() => this.dismissToast(a.id), 6000),
        );
        this.count.update((n) => n + triggered.length);
      });
  }

  private fromEventSource(es: EventSource): Observable<Alert[]> {
    return new Observable<Alert[]>((observer) => {
      es.onmessage = (e: MessageEvent) => {
        try {
          observer.next(JSON.parse(e.data) as Alert[]);
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        /* SSE auto-reconnects */
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
