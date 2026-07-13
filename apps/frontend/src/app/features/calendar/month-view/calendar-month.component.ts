import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarApiService } from '../services/calendar-api.service';
import { CalendarEvent } from '../models/event.model';

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'aph-calendar-month',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-month.component.html',
  styleUrl: './calendar-month.component.scss',
})
export class CalendarMonthComponent implements OnInit {
  readonly cursor = signal(new Date());
  readonly events = signal<CalendarEvent[]>([]);
  readonly loading = signal(true);
  readonly newTitle = signal('');
  readonly newDate = signal(this.toDateInputValue(new Date()));

  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly monthLabel = computed(() => {
    const d = this.cursor();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly days = computed<DayCell[]>(() => {
    const cursor = this.cursor();
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(year, month, 1 - startOffset);
    const today = new Date();
    const events = this.events();

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return {
        date,
        inCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        events: events.filter((e) => this.isSameDay(new Date(e.startAt), date)),
      };
    });
  });

  constructor(private readonly calendarApi: CalendarApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    const cursor = this.cursor();
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0).toISOString();

    this.calendarApi.list(from, to).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevMonth(): void {
    const d = this.cursor();
    this.cursor.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.refresh();
  }

  nextMonth(): void {
    const d = this.cursor();
    this.cursor.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.refresh();
  }

  createEvent(): void {
    const title = this.newTitle().trim();
    const dateValue = this.newDate();
    if (!title || !dateValue) return;

    const startAt = new Date(`${dateValue}T09:00:00`);
    const endAt = new Date(`${dateValue}T09:30:00`);

    this.calendarApi
      .create({ title, startAt: startAt.toISOString(), endAt: endAt.toISOString() })
      .subscribe(() => {
        this.newTitle.set('');
        this.refresh();
      });
  }

  deleteEvent(id: string, evt: Event): void {
    evt.stopPropagation();
    this.calendarApi.remove(id).subscribe(() => this.refresh());
  }

  trackByDay(_index: number, day: DayCell): string {
    return day.date.toDateString();
  }

  trackByEventId(_index: number, event: CalendarEvent): string {
    return event.id;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private toDateInputValue(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
