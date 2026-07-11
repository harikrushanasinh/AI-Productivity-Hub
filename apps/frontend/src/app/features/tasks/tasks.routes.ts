import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/tasks-list.component').then((m) => m.TasksListComponent),
  },
];
