import { Routes } from '@angular/router';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/expenses-list.component').then((m) => m.ExpensesListComponent),
  },
];
