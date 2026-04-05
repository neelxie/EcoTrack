import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert, Station } from '../../../../core/models';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eco-card" style="padding:0;overflow:hidden;">
      <div
        style="padding:1rem 1.5rem;border-bottom:1px solid #f3f4f6;
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"
      >
        <div style="display:flex;align-items:center;gap:8px;">
          <h2 class="eco-section-title">Alert rules</h2>
          @if (alerts.length) {
            <span class="eco-badge eco-badge-info">{{ alerts.length }}</span>
          }
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          @for (opt of filterOpts; track opt.value) {
            <button
              (click)="activeFilter.set(opt.value)"
              [class]="
                activeFilter() === opt.value
                  ? 'eco-btn-primary'
                  : 'eco-btn-outlined'
              "
              style="padding:4px 12px;font-size:0.75rem;"
            >
              {{ opt.label }}
            </button>
          }
          <button (click)="addClicked.emit()" class="eco-btn-secondary">
            + New rule
          </button>
        </div>
      </div>

      @if (!filtered().length) {
        <div class="eco-empty">
          <span class="eco-empty-icon">🔕</span>
          <p class="eco-empty-title">No alert rules yet</p>
          <p style="margin:4px 0 12px;font-size:0.875rem;color:#9ca3af;">
            Create a rule to get notified when a threshold is crossed.
          </p>
          <button (click)="addClicked.emit()" class="eco-btn-primary">
            Create your first alert
          </button>
        </div>
      }

      @if (filtered().length) {
        <div
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
                  gap:1rem;padding:1.25rem;"
        >
          @for (alert of filtered(); track alert.id) {
            <div
              style="border:1.5px solid;border-radius:10px;padding:1rem;transition:border-color 0.15s;"
              [style.border-color]="alert.is_active ? '#bfdbfe' : '#e5e7eb'"
              [style.background]="alert.is_active ? '#f8fbff' : '#fafafa'"
            >
              <div
                style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;"
              >
                <div
                  style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;"
                >
                  <span class="eco-badge eco-badge-info">{{
                    alert.metric
                  }}</span>
                  @if (alert.is_active) {
                    <span class="eco-badge eco-badge-success">Active</span>
                  } @else {
                    <span class="eco-badge eco-badge-gray">Paused</span>
                  }
                </div>
                <div style="display:flex;gap:2px;flex-shrink:0;">
                  <button
                    (click)="toggleClicked.emit(alert)"
                    style="padding:4px 6px;border-radius:6px;border:none;
                               background:transparent;cursor:pointer;font-size:0.9rem;"
                    [title]="alert.is_active ? 'Pause' : 'Activate'"
                  >
                    {{ alert.is_active ? '⏸' : '▶️' }}
                  </button>
                  <button
                    (click)="editClicked.emit(alert)"
                    style="padding:4px 6px;border-radius:6px;border:none;
                               background:transparent;cursor:pointer;font-size:0.9rem;"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    (click)="confirmDelete(alert)"
                    style="padding:4px 6px;border-radius:6px;border:none;
                               background:transparent;cursor:pointer;font-size:0.9rem;"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p
                style="font-size:0.875rem;font-weight:500;color:#111827;
                      margin:0 0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              >
                {{ stationName(alert.station_id) }}
              </p>

              <div
                style="background:white;border:1px solid #e5e7eb;border-radius:8px;
                        padding:8px 12px;font-size:0.8125rem;color:#374151;"
              >
                Trigger when
                <strong style="color:#1565c0;">{{ alert.metric }}</strong>
                {{ operatorLabel(alert.operator) }}
                <strong style="color:#111827;">{{ alert.threshold }}</strong>
              </div>

              <p class="eco-meta" style="margin-top:8px;">
                @if (alert.last_triggered_at) {
                  Last triggered:
                  {{ alert.last_triggered_at | date: 'dd MMM yyyy, HH:mm' }}
                } @else {
                  Never triggered
                }
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AlertListComponent {
  @Input() alerts: Alert[] = [];
  @Input() stations: Station[] = [];

  @Output() addClicked = new EventEmitter<void>();
  @Output() editClicked = new EventEmitter<Alert>();
  @Output() deleteClicked = new EventEmitter<number>();
  @Output() toggleClicked = new EventEmitter<Alert>();

  activeFilter = signal<'all' | 'active' | 'paused'>('all');

  filterOpts = [
    { label: 'All', value: 'all' as const },
    { label: 'Active', value: 'active' as const },
    { label: 'Paused', value: 'paused' as const },
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'active') return this.alerts.filter((a) => a.is_active);
    if (f === 'paused') return this.alerts.filter((a) => !a.is_active);
    return this.alerts;
  });

  operators: Record<string, string> = {
    gt: 'is greater than',
    gte: 'is at least',
    lt: 'is less than',
    lte: 'is at most',
    eq: 'equals',
  };

  operatorLabel(op: string): string {
    return this.operators[op] ?? op;
  }

  stationName(id: number): string {
    return this.stations.find((s) => s.id === id)?.name ?? `Station #${id}`;
  }

  confirmDelete(alert: Alert) {
    if (
      !confirm(
        `Delete alert rule for "${alert.metric}"? This cannot be undone.`,
      )
    )
      return;
    this.deleteClicked.emit(alert.id);
  }
}
