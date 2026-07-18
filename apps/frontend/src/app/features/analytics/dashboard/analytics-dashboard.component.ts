import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsApiService } from '../services/analytics-api.service';
import { AnalyticsDashboard } from '../models/dashboard.model';

@Component({
  selector: 'aph-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  readonly dashboard = signal<AnalyticsDashboard | null>(null);
  readonly loading = signal(true);

  constructor(private readonly analyticsApi: AnalyticsApiService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.analyticsApi.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatCurrency(minorUnits: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      minorUnits / 100,
    );
  }
}
