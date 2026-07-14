import { Routes } from '@angular/router';

export const GOALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/goals-list.component').then((m) => m.GoalsListComponent),
  },
];
