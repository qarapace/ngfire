import { computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { signalStoreFeature, withComputed, withProps } from '@ngrx/signals';
import { AUTH, onIdTokenChanged$ } from '@qarapace/ngfire/auth';
import { getIdTokenResult, ParsedToken, User } from 'firebase/auth';
import {
  catchError,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
} from 'rxjs';

/** Snapshot of the authenticated user and their custom claims. */
export interface AuthData<Claims = ParsedToken> {
  user: User;
  claims: Claims;
}

export interface WithNgAuthOptions {
  /** Called on every auth action error. */
  errorHandler?: (error: Error) => void;
}

/**
 * Signal store feature that exposes reactive auth state via `rxResource`.
 *
 * Uses `onIdTokenChanged$` (cold observable) so that each `rxResource`
 * subscription gets its own Firebase listener, correctly reflecting the
 * loading → resolved lifecycle on every `reload()`.
 *
 * @typeParam Claims - Shape of the custom claims attached to the Firebase ID token.
 *   Defaults to `ParsedToken` (untyped). Pass your own interface to get
 *   type-safe access via `store.claims()`.
 *
 * Usage:
 * ```typescript
 * export const AuthStore = signalStore(
 *   { providedIn: 'root' },
 *   withNgAuth<MyClaims>({ errorHandler: (err) => console.error(err) }),
 * );
 * ```
 */
export function withNgAuth<Claims = ParsedToken>(options?: WithNgAuthOptions) {
  const onError = options?.errorHandler;
  return signalStoreFeature(
    withProps(() => {
      const auth = inject(AUTH);

      const auth$ = onIdTokenChanged$(auth).pipe(
        distinctUntilChanged(),
        switchMap((user) => {
          if (!user) return of(null);
          return from(getIdTokenResult(user, true)).pipe(
            map(
              (idToken) =>
                ({
                  user: user.toJSON() as User,
                  claims: idToken.claims as Claims,
                }) as AuthData<Claims>
            ),
            catchError((error) => {
              onError?.(error);
              throw error;
            })
          );
        })
      );

      return {
        /** The Firebase Auth instance. */
        auth,

        /**
         * Reactive resource backed by `onIdTokenChanged$`.
         *
         * Emits `AuthData` (user + claims) when authenticated, `null` otherwise.
         * The resource `status` signal (`idle` → `loading` → `resolved`) reflects
         * the indeterminate state during auth flows (sign-in, sign-out, token refresh).
         */
        authResource: rxResource({ stream: () => auth$ }),
      };
    }),

    withComputed((store) => {
      const authData = computed(() =>
        store.authResource.hasValue() ? store.authResource.value() : null
      );

      return {
        /** The resolved auth data, or `null` while loading or when signed out. */
        authData,
        /** The current Firebase `User` object, or `null` when not authenticated. */
        user: computed(() => authData()?.user ?? null),
        /** The custom claims from the ID token, or `null` when not authenticated. */
        claims: computed(() => authData()?.claims ?? null),
        /** Whether the auth resource is currently fetching (initial load or token refresh). */
        isLoading: store.authResource.isLoading,
        /** Whether a user is currently signed in. */
        isAuthenticated: computed(() => !!authData()),
        /** The current user's UID, or `null` when not authenticated. */
        uid: computed(() => authData()?.user?.uid ?? null),
      };
    })
  );
}
