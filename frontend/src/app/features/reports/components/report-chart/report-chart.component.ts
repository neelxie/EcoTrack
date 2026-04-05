import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingSummary } from '../../../../core/models';
import {
  Chart,
  ChartConfiguration,
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

type ChartMode = 'line' | 'bar';

const PALETTE = [
  '#1565C0',
  '#00897B',
  '#F57F17',
  '#C62828',
  '#6A1B9A',
  '#00838F',
  '#2E7D32',
  '#4527A0',
];

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eco-card">
      <!-- Header -->
      <div
        style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px;"
      >
        <div>
          <h2
            style="font-size:0.875rem;font-weight:600;color:#374151;margin:0;"
          >
            Trend over time
          </h2>
          <p style="font-size:0.75rem;color:#94A3B8;margin:2px 0 0;">
            Daily averages grouped by station &amp; metric
          </p>
        </div>

        <!-- Mode toggle -->
        <div
          style="display:flex;background:#F1F5F9;border-radius:8px;padding:3px;gap:2px;"
        >
          @for (m of modes; track m.value) {
            <button
              (click)="setMode(m.value)"
              [style.background]="
                activeMode() === m.value ? '#fff' : 'transparent'
              "
              [style.color]="activeMode() === m.value ? '#1565C0' : '#64748B'"
              [style.fontWeight]="activeMode() === m.value ? '600' : '400'"
              style="padding:4px 12px;border-radius:6px;border:none;
                           font-size:0.75rem;cursor:pointer;transition:all 0.15s;
                           box-shadow:none;"
              [style.boxShadow]="
                activeMode() === m.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              "
            >
              {{ m.label }}
            </button>
          }
        </div>
      </div>

      <!-- Empty -->
      @if (!hasData()) {
        <div
          style="height:280px;display:flex;flex-direction:column;
                    align-items:center;justify-content:center;color:#CBD5E1;"
        >
          <span style="font-size:3rem;margin-bottom:12px;">📊</span>
          <p style="font-size:0.875rem;margin:0;">
            Select stations and a date range to see trends.
          </p>
        </div>
      }

      <!-- Canvas -->
      <div
        [style.display]="hasData() ? 'block' : 'none'"
        style="position:relative;height:280px;"
      >
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class ReportChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() data: ReadingSummary[] = [];
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  activeMode = signal<ChartMode>('line');
  hasData = signal(false);
  modes = [
    { label: 'Line', value: 'line' as ChartMode },
    { label: 'Bar', value: 'bar' as ChartMode },
  ];

  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.build();
  }

  ngOnChanges(c: SimpleChanges) {
    if (c['data'] && this.chart) this.update();
  }

  setMode(m: ChartMode) {
    this.activeMode.set(m);
    this.chart?.destroy();
    this.chart = null;
    setTimeout(() => {
      this.build();
      this.update();
    }, 0);
  }

  private build() {
    const ctx = this.canvasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const cfg: ChartConfiguration = {
      type: this.activeMode(),
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 11 }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#94a3b8', maxTicksLimit: 12 },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#94a3b8' },
            beginAtZero: false,
          },
        },
        elements: {
          point: { radius: 2, hoverRadius: 5 },
          line: { tension: 0.4 },
        },
      },
    };
    this.chart = new Chart(ctx, cfg);
  }

  private update() {
    if (!this.chart || !this.data.length) {
      this.hasData.set(false);
      return;
    }

    // Group by station_id + metric
    const groups = new Map<
      string,
      { label: string; points: Map<string, number> }
    >();

    for (const row of this.data) {
      const key = `${row.station_id}|${row.metric}`;
      const label = `Station ${row.station_id} — ${row.metric} (${row.unit})`;
      if (!groups.has(key)) groups.set(key, { label, points: new Map() });
      groups.get(key)!.points.set(row.date, row.avg);
    }

    // Sorted date labels
    const allDates = [...new Set(this.data.map((r) => r.date))].sort();
    const isLine = this.activeMode() === 'line';
    let ci = 0;

    const datasets = [...groups.values()].map((g) => {
      const colour = PALETTE[ci++ % PALETTE.length];
      return {
        label: g.label,
        data: allDates.map((d) => g.points.get(d) ?? null),
        borderColor: colour,
        backgroundColor: isLine ? colour + '18' : colour + 'CC',
        borderWidth: isLine ? 2 : 0,
        fill: isLine,
        pointBackgroundColor: colour,
        spanGaps: true,
      };
    });

    this.chart.data = { labels: allDates, datasets } as any;
    this.chart.update('active');
    this.hasData.set(true);
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}
