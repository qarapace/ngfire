import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * Route guard that waits for auth to be ready before allowing navigation.
 *
 * Uses `onReady()` to wait for the auth state to settle (the `rxResource`
 * transitions from `loading` to `resolved`), then checks `isAuthenticated()`.
 *
 * If the user is not authenticated, it saves the target URL and redirects
 * to the sign-in page via `redirectToLogin()`.
 *
 * @example
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     canActivate: [authGuard],
 *     component: DashboardComponent,
 *   },
 * ];
 * ```
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);

  return auth.onReady().pipe(
    map(() => {
      if (!auth.isAuthenticated()) {
        auth.redirectToLogin(state.url);
        return false;
      }
      return true;
    })
  );
};
