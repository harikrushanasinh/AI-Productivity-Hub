import { Routes } from '@angular/router';

export const BOOKMARKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/bookmarks-list.component').then((m) => m.BookmarksListComponent),
  },
];
