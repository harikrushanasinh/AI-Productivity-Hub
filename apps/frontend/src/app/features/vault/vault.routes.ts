import { Routes } from '@angular/router';

export const VAULT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/vault-list.component').then((m) => m.VaultListComponent),
  },
];
