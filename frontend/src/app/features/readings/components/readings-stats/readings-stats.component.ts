import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingSummary } from '../../../../core/models';

@Component({
  selector: 'app-readings-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary) {
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="eco-card text-center">
          <p
            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
          >
            Average
          </p>
          <p class="text-2xl font-semibold text-primary">
            {{ summary.avg | number: '1.2-2' }}
            <span class="text-sm font-normal text-gray-400">{{
              summary.unit
            }}</span>
          </p>
        </div>

        <div class="eco-card text-center">
          <p
            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
          >
            Minimum
          </p>
          <p class="text-2xl font-semibold text-secondary">
            {{ summary.min | number: '1.2-2' }}
            <span class="text-sm font-normal text-gray-400">{{
              summary.unit
            }}</span>
          </p>
        </div>

        <div class="eco-card text-center">
          <p
            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
          >
            Maximum
          </p>
          <p class="text-2xl font-semibold text-error">
            {{ summary.max | number: '1.2-2' }}
            <span class="text-sm font-normal text-gray-400">{{
              summary.unit
            }}</span>
          </p>
        </div>

        <div class="eco-card text-center">
          <p
            class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
          >
            Data points
          </p>
          <p class="text-2xl font-semibold text-gray-800">
            {{ summary.count | number }}
          </p>
        </div>
      </div>
    } @else {
      <!-- Skeleton -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="eco-card">
            <div
              class="h-3 bg-gray-100 rounded animate-pulse mb-3 w-16 mx-auto"
            ></div>
            <div
              class="h-8 bg-gray-100 rounded animate-pulse mx-auto w-24"
            ></div>
          </div>
        }
      </div>
    }
  `,
})
export class ReadingsStatsComponent {
  @Input() summary: (ReadingSummary & { count: number }) | null = null;
}
