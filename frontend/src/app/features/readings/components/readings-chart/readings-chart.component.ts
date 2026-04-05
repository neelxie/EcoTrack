import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reading } from '../../../../core/models';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
);

@Component({
  selector: 'app-readings-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eco-card">
      <div
        style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:1rem;flex-wrap:wrap;gap:8px;"
      >
        <div>
          <h2 class="eco-section-title">
            {{ metric || 'Readings' }} over time
          </h2>
          @if (unit) {
            <p class="eco-meta" style="margin-top:2px;">Unit: {{ unit }}</p>
          }
        </div>
        <div
          style="display:flex;background:#f3f4f6;border-radius:8px;padding:3px;gap:2px;"
        >
          @for (t of chartTypes; track t.value) {
            <button
              (click)="setChartType(t.value)"
              [style.background]="
                activeType() === t.value ? '#fff' : 'transparent'
              "
              [style.color]="activeType() === t.value ? '#1565c0' : '#6b7280'"
              [style.font-weight]="activeType() === t.value ? '600' : '400'"
              [style.box-shadow]="
                activeType() === t.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              "
              style="padding:4px 14px;border-radius:6px;border:none;
                   font-size:0.75rem;cursor:pointer;transition:all 0.15s;
                   font-family:inherit;"
            >
              {{ t.label }}
            </button>
          }
        </div>
      </div>

      @if (!hasData()) {
        <div
          style="height:280px;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;color:#d1d5db;"
        >
          <span style="font-size:3rem;margin-bottom:12px;">📈</span>
          <p style="font-size:0.875rem;margin:0;color:#9ca3af;">
            No readings for this selection.
          </p>
          <p style="font-size:0.75rem;margin:4px 0 0;color:#d1d5db;">
            Try a different station, metric, or date range.
          </p>
        </div>
      }

      <div
        [style.display]="hasData() ? 'block' : 'none'"
        style="position:relative;height:280px;"
      >
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class ReadingsChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() readings: Reading[] = [];
  @Input() metric = '';
  @Input() unit = '';

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  activeType = signal<'line' | 'bar'>('line');
  hasData = signal(false);

  chartTypes = [
    { label: 'Line', value: 'line' as const },
    { label: 'Bar', value: 'bar' as const },
  ];

  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.buildChart();
    if (this.readings.length) this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['readings'] && this.chart) this.updateChart();
  }

  setChartType(type: 'line' | 'bar') {
    this.activeType.set(type);
    this.chart?.destroy();
    this.chart = null;
    // Allow one tick for the canvas to be available again
    setTimeout(() => {
      this.buildChart();
      this.updateChart();
    }, 0);
  }

  private buildChart() {
    const ctx = this.canvasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const isLine = this.activeType() === 'line';

    const config: ChartConfiguration = {
      type: this.activeType(),
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) =>
                ` ${(ctx.parsed?.y ?? 0).toFixed(2)} ${this.unit}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 10 },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 11 }, color: '#94a3b8' },
            beginAtZero: false,
          },
        },
        elements: {
          point: {
            radius: isLine ? 3 : 0,
            hoverRadius: isLine ? 6 : 0,
            borderWidth: 2,
          },
          line: { tension: 0.4 },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (!this.chart) return;

    const sorted = [...this.readings].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

    this.hasData.set(sorted.length > 0);
    if (!sorted.length) return;

    const labels = sorted.map((r) => this.formatDate(r.recorded_at));
    const values = sorted.map((r) => r.value);
    const isLine = this.activeType() === 'line';
    const primary = '#1565C0';

    this.chart.data = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: primary,
          backgroundColor: isLine
            ? 'rgba(21,101,192,0.08)'
            : 'rgba(21,101,192,0.75)',
          borderWidth: isLine ? 2 : 0,
          fill: isLine,
          pointBackgroundColor: primary,
        },
      ],
    } as ChartData;

    this.chart.update('active');
  }

  private formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}
