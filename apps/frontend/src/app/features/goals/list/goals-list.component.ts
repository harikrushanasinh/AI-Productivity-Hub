import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalsApiService } from '../services/goals-api.service';
import { Goal } from '../models/goal.model';

@Component({
  selector: 'aph-goals-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-list.component.html',
  styleUrl: './goals-list.component.scss',
})
export class GoalsListComponent implements OnInit {
  readonly goals = signal<Goal[]>([]);
  readonly loading = signal(true);
  readonly newTitle = signal('');
  readonly newMilestoneTitle = signal<Record<string, string>>({});

  constructor(private readonly goalsApi: GoalsApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.goalsApi.list().subscribe({
      next: (goals) => {
        this.goals.set(goals);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createGoal(): void {
    const title = this.newTitle().trim();
    if (!title) return;
    this.goalsApi.create({ title }).subscribe(() => {
      this.newTitle.set('');
      this.refresh();
    });
  }

  deleteGoal(id: string): void {
    this.goalsApi.remove(id).subscribe(() => this.refresh());
  }

  milestoneDraft(goalId: string): string {
    return this.newMilestoneTitle()[goalId] ?? '';
  }

  setMilestoneDraft(goalId: string, value: string): void {
    this.newMilestoneTitle.update((map) => ({ ...map, [goalId]: value }));
  }

  addMilestone(goalId: string): void {
    const title = this.milestoneDraft(goalId).trim();
    if (!title) return;
    this.goalsApi.addMilestone(goalId, title).subscribe(() => {
      this.setMilestoneDraft(goalId, '');
      this.refresh();
    });
  }

  toggleMilestone(goalId: string, milestoneId: string): void {
    this.goalsApi.toggleMilestone(goalId, milestoneId).subscribe(() => this.refresh());
  }

  trackByGoalId(_index: number, goal: Goal): string {
    return goal.id;
  }

  trackByMilestoneId(_index: number, milestone: { id: string }): string {
    return milestone.id;
  }
}
