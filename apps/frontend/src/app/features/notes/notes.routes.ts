import { Routes } from '@angular/router';

export const NOTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/notes-list.component').then((m) => m.NotesListComponent),
  },
];
