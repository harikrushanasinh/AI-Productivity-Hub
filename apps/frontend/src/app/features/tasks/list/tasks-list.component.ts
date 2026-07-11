import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksApiService } from '../services/tasks-api.service';
import { Task, TaskStatus } from '../models/task.model';

@Component({
  selector: 'aph-tasks-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.scss',
})
export class TasksListComponent implements OnInit {
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly newTitle = signal('');

  constructor(private readonly tasksApi: TasksApiService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.tasksApi.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createTask(): void {
    const title = this.newTitle().trim();
    if (!title) return;
    this.tasksApi.create({ title }).subscribe(() => {
      this.newTitle.set('');
      this.refresh();
    });
  }

  toggleDone(task: Task): void {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    this.tasksApi.updateStatus(task.id, nextStatus).subscribe(() => this.refresh());
  }

  deleteTask(id: string): void {
    this.tasksApi.remove(id).subscribe(() => this.refresh());
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
}
