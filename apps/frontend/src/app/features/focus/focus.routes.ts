import { Routes } from '@angular/router';

export const FOCUS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./timer/focus-timer.component').then((m) => m.FocusTimerComponent),
  },
];
