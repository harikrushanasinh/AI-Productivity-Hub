import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitsApiService } from '../services/habits-api.service';
import { Habit } from '../models/habit.model';

@Component({
  selector: 'aph-habits-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habits-list.component.html',
  styleUrl: './habits-list.component.scss',
})
export class HabitsListComponent implements OnInit {
  readonly habits = signal<Habit[]>([]);
  readonly loading = signal(true);
  readonly newName = signal('');

  constructor(private readonly habitsApi: HabitsApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.habitsApi.list().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createHabit(): void {
    const name = this.newName().trim();
    if (!name) return;
    this.habitsApi.create({ name }).subscribe(() => {
      this.newName.set('');
      this.refresh();
    });
  }

  toggleToday(habit: Habit): void {
    const action$ = habit.completedToday
      ? this.habitsApi.unlogToday(habit.id)
      : this.habitsApi.logToday(habit.id);
    action$.subscribe(() => this.refresh());
  }

  deleteHabit(id: string): void {
    this.habitsApi.remove(id).subscribe(() => this.refresh());
  }

  trackByHabitId(_index: number, habit: Habit): string {
    return habit.id;
  }
}
