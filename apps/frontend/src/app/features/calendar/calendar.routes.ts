import { Routes } from '@angular/router';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./month-view/calendar-month.component').then((m) => m.CalendarMonthComponent),
  },
];
