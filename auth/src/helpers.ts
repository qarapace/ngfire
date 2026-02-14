import {
  Auth,
  onAuthStateChanged,
  onIdTokenChanged,
  User,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { fromFirebaseListener } from '../../app/src/helpers';

/**
 * Observable wrapper around `onAuthStateChanged`.
 *
 * Emits when the user signs in or signs out.
 * Does **not** fire on token refresh — use `onIdTokenChanged$` for that.
 *
 * **Opinionated**: the returned observable is shared (see `fromFirebaseListener`).
 *
 * @example
 * ```typescript
 * onAuthStateChanged$(auth).pipe(
 *   map(user => user?.uid ?? null)
 * );
 * ```
 */
export function onAuthStateChanged$(auth: Auth): Observable<User | null> {
  return fromFirebaseListener((next, error) =>
    onAuthStateChanged(auth, next, error)
  );
}

/**
 * Observable wrapper around `onIdTokenChanged`.
 *
 * Emits when the user signs in, signs out, **or** when the ID token is refreshed.
 *
 * **Opinionated**: the returned observable is shared (see `fromFirebaseListener`).
 *
 * @example
 * ```typescript
 * onIdTokenChanged$(auth).pipe(
 *   switchMap(user => user ? from(getIdTokenResult(user)) : of(null))
 * );
 * ```
 */
export function onIdTokenChanged$(auth: Auth): Observable<User | null> {
  return fromFirebaseListener((next, error) =>
    onIdTokenChanged(auth, next, error)
  );
}
