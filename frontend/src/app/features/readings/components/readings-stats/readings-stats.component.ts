import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingSummary } from '../../../../core/models';

@Component({
  selector: 'app-readings-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary) {
      <div class="eco-kpi-grid">
        <div class="eco-kpi-card">
          <div class="eco-kpi-icon eco-kpi-icon-blue">📊</div>
          <div>
            <p class="eco-kpi-label">Average</p>
            <p class="eco-kpi-value" style="font-size:1.5rem;">
              {{ summary.avg | number: '1.2-2' }}
              <span style="font-size:0.875rem;font-weight:400;color:#9ca3af;">{{
                summary.unit
              }}</span>
            </p>
          </div>
        </div>
        <div class="eco-kpi-card">
          <div class="eco-kpi-icon eco-kpi-icon-green">📉</div>
          <div>
            <p class="eco-kpi-label">Minimum</p>
            <p class="eco-kpi-value" style="font-size:1.5rem;color:#00897b;">
              {{ summary.min | number: '1.2-2' }}
              <span style="font-size:0.875rem;font-weight:400;color:#9ca3af;">{{
                summary.unit
              }}</span>
            </p>
          </div>
        </div>
        <div class="eco-kpi-card">
          <div class="eco-kpi-icon eco-kpi-icon-yellow">📈</div>
          <div>
            <p class="eco-kpi-label">Maximum</p>
            <p class="eco-kpi-value" style="font-size:1.5rem;color:#c62828;">
              {{ summary.max | number: '1.2-2' }}
              <span style="font-size:0.875rem;font-weight:400;color:#9ca3af;">{{
                summary.unit
              }}</span>
            </p>
          </div>
        </div>
        <div class="eco-kpi-card">
          <div class="eco-kpi-icon eco-kpi-icon-purple">🔢</div>
          <div>
            <p class="eco-kpi-label">Data points</p>
            <p class="eco-kpi-value" style="font-size:1.5rem;">
              {{ summary.count | number }}
            </p>
          </div>
        </div>
      </div>
    } @else {
      <div class="eco-kpi-grid">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="eco-kpi-card">
            <div
              class="eco-skeleton"
              style="width:48px;height:48px;border-radius:12px;flex-shrink:0;"
            ></div>
            <div style="flex:1;">
              <div
                class="eco-skeleton"
                style="height:10px;width:60px;margin-bottom:8px;"
              ></div>
              <div class="eco-skeleton" style="height:24px;width:80px;"></div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ReadingsStatsComponent {
  @Input() summary: (ReadingSummary & { count: number }) | null = null;
}
