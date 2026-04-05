import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { StationListComponent } from './components/station-list/station-list.component';
import { StationMapComponent } from './components/station-map/station-map.component';
import { StationFormComponent } from './components/station-form/station-form.component';
import { StationService } from '../../core/services/station.service';
import { Station } from '../../core/models';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [
    CommonModule,
    ShellComponent,
    StationListComponent,
    StationMapComponent,
    StationFormComponent,
  ],
  template: `
    <app-shell>
      <div class="eco-page">
        <div class="eco-topbar">
          <div>
            <h1 class="eco-page-title">Stations</h1>
            <p class="eco-page-subtitle">
              Manage monitoring stations and view their locations
            </p>
          </div>
        </div>

        <app-station-map
          [stations]="allStations()"
          (stationClicked)="onMapClick($event)"
        />

        <app-station-list
          #listRef
          (addClicked)="openForm(null)"
          (editClicked)="openForm($event)"
          (rowClicked)="onMapClick($event)"
          (deleted)="onDeleted($event)"
        />
      </div>
    </app-shell>

    @if (showForm()) {
      <app-station-form
        [station]="editingStation()"
        (saved)="onSaved($event)"
        (cancel)="closeForm()"
      />
    }
  `,
})
export class StationsComponent implements OnInit {
  allStations = signal<Station[]>([]);
  showForm = signal(false);
  editingStation = signal<Station | null>(null);

  @ViewChild('listRef') listRef!: StationListComponent;
  @ViewChild(StationFormComponent) formRef!: StationFormComponent;

  constructor(private stationSvc: StationService) {}

  ngOnInit() {
    // Load ALL active stations for the map (unpaginated)
    this.stationSvc.list({ active: true, page: 1 }).subscribe((res) => {
      this.allStations.set(res.data);
    });
  }

  openForm(station: Station | null) {
    this.editingStation.set(station);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingStation.set(null);
  }

  onSaved(payload: Partial<Station>) {
    const editing = this.editingStation();

    const request$ = editing
      ? this.stationSvc.update(editing.id, payload)
      : this.stationSvc.create(payload);

    request$.subscribe({
      next: (res) => {
        const station = res.data;

        if (editing) {
          // Update in map list
          this.allStations.update((list) =>
            list.map((s) => (s.id === station.id ? station : s)),
          );
        } else {
          this.allStations.update((list) => [station, ...list]);
        }

        // Refresh the paginated list
        this.listRef?.searchCtrl.updateValueAndValidity({ emitEvent: true });
        this.closeForm();
      },
      error: (err) => {
        const msg =
          err.error?.message ?? 'Something went wrong. Please try again.';
        this.formRef?.setError(msg);
        this.formRef?.setSaving(false);
      },
    });
  }

  onMapClick(station: Station) {
    // Scroll to the row in the table (future enhancement: highlight row)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  onDeleted(id: number) {
    this.allStations.update((list) => list.filter((s) => s.id !== id));
  }
}
