import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Protects feature routes: redirects unauthenticated users to /auth/login. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() || authService.getAccessToken()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
