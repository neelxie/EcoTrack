import { Component, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ShellComponent } from '../../shared/components/shell/shell.component';
import { AlertListComponent } from './components/alert-list/alert-list.component';
import {
  AlertFormComponent,
  AlertPayload,
} from './components/alert-form/alert-form.component';
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
      <div class="eco-page">
        <!-- Header -->
        <div class="eco-topbar">
          <div>
            <h1 class="eco-page-title">Alerts</h1>
            <p class="eco-page-subtitle">
              Define threshold rules — get notified in real time when they
              trigger
            </p>
          </div>
          <div
            style="display:flex;align-items:center;gap:8px;
                      font-size:0.75rem;color:#6b7280;"
          >
            <span
              style="width:8px;height:8px;border-radius:50%;
                         background:#22c55e;display:inline-block;
                         animation:eco-pulse 1.5s ease-in-out infinite;"
            ></span>
            Live stream active
          </div>
        </div>

        <!-- How it works — only when empty -->
        @if (!loading() && alerts().length === 0) {
          <div
            class="eco-card eco-alert-info"
            style="display:flex;align-items:flex-start;gap:1rem;padding:1.25rem 1.5rem;"
          >
            <span style="font-size:1.75rem;flex-shrink:0;">💡</span>
            <div>
              <h3
                style="font-size:0.875rem;font-weight:600;color:#1e40af;margin:0 0 4px;"
              >
                How alerts work
              </h3>
              <p
                style="font-size:0.875rem;color:#1e40af;margin:0;line-height:1.6;"
              >
                Create a rule by choosing a station, metric, condition, and
                threshold. The server evaluates active rules every minute. When
                a rule triggers, a live notification appears in the sidebar
                instantly.
              </p>
            </div>
          </div>
        }

        <!-- Loading skeleton -->
        @if (loading()) {
          <div
            style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;"
          >
            @for (i of [1, 2, 3, 4]; track i) {
              <div
                class="eco-skeleton"
                style="height:140px;border-radius:12px;"
              ></div>
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
    const req$ = editing
      ? this.alertSvc.update(editing.id, payload)
      : this.alertSvc.create(payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
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
        this.formRef?.setError(err.error?.message ?? 'Something went wrong.');
      },
    });
  }

  onDelete(id: number) {
    this.alertSvc
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() =>
        this.alerts.update((list) => list.filter((a) => a.id !== id)),
      );
  }

  onToggle(alert: Alert) {
    this.alertSvc
      .update(alert.id, { is_active: !alert.is_active })
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) =>
        this.alerts.update((list) =>
          list.map((a) => (a.id === updated.id ? updated : a)),
        ),
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
