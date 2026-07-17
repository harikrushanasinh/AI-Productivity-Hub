import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    // All authenticated feature routes render inside the sidebar/topbar shell.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'notes',
        loadChildren: () => import('./features/notes/notes.routes').then((m) => m.NOTES_ROUTES),
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar.routes').then((m) => m.CALENDAR_ROUTES),
      },
      {
        path: 'journal',
        loadChildren: () =>
          import('./features/journal/journal.routes').then((m) => m.JOURNAL_ROUTES),
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses.routes').then((m) => m.EXPENSES_ROUTES),
      },
      {
        path: 'habits',
        loadChildren: () =>
          import('./features/habits/habits.routes').then((m) => m.HABITS_ROUTES),
      },
      {
        path: 'goals',
        loadChildren: () => import('./features/goals/goals.routes').then((m) => m.GOALS_ROUTES),
      },
      {
        path: 'focus',
        loadChildren: () => import('./features/focus/focus.routes').then((m) => m.FOCUS_ROUTES),
      },
      {
        path: 'bookmarks',
        loadChildren: () =>
          import('./features/bookmarks/bookmarks.routes').then((m) => m.BOOKMARKS_ROUTES),
      },
      {
        path: 'files',
        loadChildren: () => import('./features/files/files.routes').then((m) => m.FILES_ROUTES),
      },
      {
        path: 'vault',
        loadChildren: () => import('./features/vault/vault.routes').then((m) => m.VAULT_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
