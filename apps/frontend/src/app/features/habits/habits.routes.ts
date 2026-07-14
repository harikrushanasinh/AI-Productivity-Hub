import { Routes } from '@angular/router';

export const HABITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/habits-list.component').then((m) => m.HabitsListComponent),
  },
];
