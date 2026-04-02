import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Station } from '../../../../core/models';

// Fix default Leaflet marker icon paths broken by Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ICONS: Record<string, L.DivIcon> = {
  air_quality: L.divIcon({
    className: '',
    html: `<div style="background:#1565C0;width:28px;height:28px;border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);border:3px solid white;
                box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  }),
  weather: L.divIcon({
    className: '',
    html: `<div style="background:#00897B;width:28px;height:28px;border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);border:3px solid white;
                box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  }),
  emissions: L.divIcon({
    className: '',
    html: `<div style="background:#F57F17;width:28px;height:28px;border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);border:3px solid white;
                box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  }),
};

@Component({
  selector: 'app-station-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eco-card p-0 overflow-hidden">
      <div
        class="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
      >
        <h2 class="text-sm font-semibold text-gray-700">Station map</h2>
        <div class="flex items-center gap-3 text-xs text-gray-500">
          @for (entry of legend; track entry.label) {
            <span class="flex items-center gap-1">
              <span
                class="w-3 h-3 rounded-full inline-block"
                [style.background]="entry.color"
              ></span>
              {{ entry.label }}
            </span>
          }
        </div>
      </div>
      <div #mapEl style="height: 340px; width: 100%;"></div>
    </div>
  `,
})
export class StationMapComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() stations: Station[] = [];
  @Output() stationClicked = new EventEmitter<Station>();

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  legend = [
    { label: 'Air quality', color: '#1565C0' },
    { label: 'Weather', color: '#00897B' },
    { label: 'Emissions', color: '#F57F17' },
  ];

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView([0, 20], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Render any stations already passed before the map was ready
    if (this.stations.length) this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stations'] && this.map) this.renderMarkers();
  }

  private renderMarkers() {
    this.markers.forEach((m) => m.remove());
    this.markers = [];

    this.stations.forEach((station) => {
      const icon = ICONS[station.type] ?? ICONS['air_quality'];
      const marker = L.marker([station.latitude, station.longitude], {
        icon,
      }).addTo(this.map).bindPopup(`
          <div style="min-width:160px">
            <strong style="font-size:13px">${station.name}</strong><br>
            <span style="font-size:12px;color:#666">${station.city}, ${station.country}</span><br>
            <span style="font-size:11px;background:#E3F2FD;color:#1565C0;
                         padding:2px 6px;border-radius:9999px;display:inline-block;margin-top:4px">
              ${station.type.replace('_', ' ')}
            </span>
          </div>
        `);

      marker.on('click', () => this.stationClicked.emit(station));
      this.markers.push(marker);
    });

    if (this.stations.length) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
