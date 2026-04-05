import { Component, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ShellComponent } from '../../shared/components/shell/shell.component';
import { AlertListComponent } from '../alerts/components/alert-list/alert-list.component';
import {
  AlertFormComponent,
  AlertPayload,
} from '../alerts/components/alert-form/alert-form.component';

import { AlertService } from '../../core/services/alert.services';
import { StationService } from '../../core/services/station.service';
import { Alert, Station } from '../../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    AlertListComponent,
    AlertFormComponent,
  ],
  template: `
    <app-shell>
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Alerts</h1>
            <p class="text-sm text-gray-500 mt-1">
              Define threshold rules — get notified in real time when they
              trigger
            </p>
          </div>

          <!-- Live indicator -->
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span
              class="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            ></span>
            Live stream active
          </div>
        </div>

        <!-- How it works banner (shown only when no alerts exist) -->
        @if (!loading() && alerts().length === 0) {
          <div class="eco-card border border-blue-100 bg-blue-50/40">
            <div class="flex items-start gap-4">
              <span class="text-3xl">💡</span>
              <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-1">
                  How alerts work
                </h3>
                <p class="text-sm text-gray-600 leading-relaxed">
                  Create a rule by choosing a station, metric, condition, and
                  threshold. The server evaluates active rules every minute.
                  When a rule triggers, a live notification appears in the
                  sidebar instantly — no page refresh needed.
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="eco-card h-32 animate-pulse bg-gray-50"></div>
            }
          </div>
        }

        <!-- Alert list -->
        @if (!loading()) {
          <app-alert-list
            [alerts]="alerts()"
            [stations]="stations()"
            (addClicked)="openForm(null)"
            (editClicked)="openForm($event)"
            (deleteClicked)="onDelete($event)"
            (toggleClicked)="onToggle($event)"
          />
        }
      </div>
    </app-shell>

    <!-- Create / Edit modal -->
    @if (showForm()) {
      <app-alert-form
        #formRef
        [stations]="stations()"
        [alert]="editingAlert()"
        (saved)="onSaved($event)"
        (cancel)="closeForm()"
      />
    }
  `,
})
export class AlertsComponent implements OnInit, OnDestroy {
  alerts = signal<Alert[]>([]);
  stations = signal<Station[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingAlert = signal<Alert | null>(null);

  @ViewChild('formRef') formRef!: AlertFormComponent;

  private destroy$ = new Subject<void>();

  constructor(
    private alertSvc: AlertService,
    private stationSvc: StationService,
  ) {}

  ngOnInit() {
    forkJoin([this.alertSvc.list(), this.stationSvc.list({ active: true })])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([alerts, stationsRes]) => {
        this.alerts.set(alerts);
        this.stations.set(stationsRes.data);
        this.loading.set(false);
      });
  }

  openForm(alert: Alert | null) {
    this.editingAlert.set(alert);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingAlert.set(null);
  }

  onSaved(payload: AlertPayload) {
    const editing = this.editingAlert();

    const request$ = editing
      ? this.alertSvc.update(editing.id, payload)
      : this.alertSvc.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (saved) => {
        if (editing) {
          this.alerts.update((list) =>
            list.map((a) => (a.id === saved.id ? saved : a)),
          );
        } else {
          this.alerts.update((list) => [saved, ...list]);
        }
        this.closeForm();
      },
      error: (err) => {
        const msg =
          err.error?.message ?? 'Something went wrong. Please try again.';
        this.formRef?.setError(msg);
      },
    });
  }

  onDelete(id: number) {
    this.alertSvc
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.alerts.update((list) => list.filter((a) => a.id !== id));
      });
  }

  onToggle(alert: Alert) {
    this.alertSvc
      .update(alert.id, { is_active: !alert.is_active })
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        this.alerts.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a)),
        );
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
