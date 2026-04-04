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
    <div class="eco-card">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-semibold text-gray-700">Your alert rules</h2>
          @if (alerts.length) {
            <span class="eco-badge-info">{{ alerts.length }}</span>
          }
        </div>
        <div class="flex items-center gap-2">
          <!-- Status filter pills -->
          @for (opt of filterOpts; track opt.value) {
            <button
              (click)="activeFilter.set(opt.value)"
              [class]="
                activeFilter() === opt.value
                  ? 'eco-btn-primary px-3 py-1.5 text-xs'
                  : 'eco-btn-outlined px-3 py-1.5 text-xs'
              "
            >
              {{ opt.label }}
            </button>
          }
          <button (click)="addClicked.emit()" class="eco-btn-secondary">
            + New rule
          </button>
        </div>
      </div>

      <!-- Empty state -->
      @if (!filtered().length) {
        <div class="py-14 text-center">
          <span class="text-5xl">🔕</span>
          <p class="text-sm text-gray-500 mt-3">No alert rules yet.</p>
          <button
            (click)="addClicked.emit()"
            class="eco-btn-primary mt-4 text-sm"
          >
            Create your first alert
          </button>
        </div>
      }

      <!-- Alert cards grid -->
      @if (filtered().length) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (alert of filtered(); track alert.id) {
            <div
              class="border rounded-xl p-4 transition-all duration-150"
              [class]="
                alert.is_active
                  ? 'border-blue-100 bg-blue-50/30 hover:border-blue-200'
                  : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
              "
            >
              <!-- Card header -->
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="eco-badge-info text-xs">{{
                      alert.metric
                    }}</span>
                    @if (alert.is_active) {
                      <span class="eco-badge-success text-xs">Active</span>
                    } @else {
                      <span class="eco-badge-error text-xs">Paused</span>
                    }
                  </div>
                  <p class="text-sm font-medium text-gray-900 mt-1.5 truncate">
                    {{ stationName(alert.station_id) }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 flex-shrink-0">
                  <!-- Toggle active -->
                  <button
                    (click)="toggleClicked.emit(alert)"
                    [title]="alert.is_active ? 'Pause alert' : 'Activate alert'"
                    class="p-1.5 rounded-lg hover:bg-white text-gray-400
                           hover:text-primary transition-colors"
                  >
                    {{ alert.is_active ? '⏸' : '▶️' }}
                  </button>
                  <button
                    (click)="editClicked.emit(alert)"
                    class="p-1.5 rounded-lg hover:bg-white text-gray-400
                           hover:text-primary transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    (click)="confirmDelete(alert)"
                    class="p-1.5 rounded-lg hover:bg-white text-gray-400
                           hover:text-error transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Rule summary -->
              <div
                class="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100"
              >
                Trigger when
                <span class="font-semibold text-primary">{{
                  alert.metric
                }}</span>
                <span class="mx-1">{{ operatorLabel(alert.operator) }}</span>
                <span class="font-semibold text-gray-900">{{
                  alert.threshold
                }}</span>
              </div>

              <!-- Last triggered -->
              @if (alert.last_triggered_at) {
                <p class="text-xs text-gray-400 mt-2">
                  Last triggered:
                  {{ alert.last_triggered_at | date: 'dd MMM yyyy, HH:mm' }}
                </p>
              } @else {
                <p class="text-xs text-gray-400 mt-2">Never triggered</p>
              }
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
