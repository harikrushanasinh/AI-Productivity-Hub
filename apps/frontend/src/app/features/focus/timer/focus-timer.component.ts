import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusApiService } from '../services/focus-api.service';
import { FocusSession, FocusSessionType, TodayStats } from '../models/focus-session.model';

const PRESET_MINUTES: Record<FocusSessionType, number> = {
  work: 25,
  short_break: 5,
  long_break: 15,
};

@Component({
  selector: 'aph-focus-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './focus-timer.component.html',
  styleUrl: './focus-timer.component.scss',
})
export class FocusTimerComponent implements OnInit, OnDestroy {
  readonly sessionType = signal<FocusSessionType>('work');
  readonly totalSeconds = signal(PRESET_MINUTES.work * 60);
  readonly remainingSeconds = signal(PRESET_MINUTES.work * 60);
  readonly isRunning = signal(false);
  readonly currentSession = signal<FocusSession | null>(null);
  readonly history = signal<FocusSession[]>([]);
  readonly todayStats = signal<TodayStats | null>(null);

  readonly minutesLabel = computed(() => {
    const s = this.remainingSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  readonly progressPercent = computed(() => {
    const total = this.totalSeconds();
    if (total === 0) return 0;
    return Math.round(((total - this.remainingSeconds()) / total) * 100);
  });

  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly focusApi: FocusApiService) {}

  ngOnInit(): void {
    this.refreshHistoryAndStats();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  selectType(type: FocusSessionType): void {
    if (this.isRunning()) return;
    this.sessionType.set(type);
    const seconds = PRESET_MINUTES[type] * 60;
    this.totalSeconds.set(seconds);
    this.remainingSeconds.set(seconds);
  }

  start(): void {
    if (this.isRunning()) return;

    this.focusApi.start(this.sessionType(), PRESET_MINUTES[this.sessionType()]).subscribe((session) => {
      this.currentSession.set(session);
      this.isRunning.set(true);

      this.intervalHandle = setInterval(() => {
        const next = this.remainingSeconds() - 1;
        if (next <= 0) {
          this.remainingSeconds.set(0);
          this.finish(false);
        } else {
          this.remainingSeconds.set(next);
        }
      }, 1000);
    });
  }

  stopEarly(): void {
    if (!this.isRunning()) return;
    this.finish(true);
  }

  private finish(interrupted: boolean): void {
    this.clearTimer();
    const session = this.currentSession();
    this.isRunning.set(false);

    if (session) {
      const elapsed = this.totalSeconds() - this.remainingSeconds();
      this.focusApi.complete(session.id, elapsed, interrupted).subscribe(() => {
        this.refreshHistoryAndStats();
      });
    }

    this.currentSession.set(null);
    this.remainingSeconds.set(this.totalSeconds());
  }

  private refreshHistoryAndStats(): void {
    this.focusApi.history().subscribe((history) => this.history.set(history));
    this.focusApi.todayStats().subscribe((stats) => this.todayStats.set(stats));
  }

  private clearTimer(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  trackBySessionId(_index: number, session: FocusSession): string {
    return session.id;
  }

  formatDuration(actualSeconds: number): number {
    return Math.round(actualSeconds / 60);
  }

  formatType(type: FocusSessionType): string {
    return type.replace('_', ' ');
  }
}
