import { computed, inject } from '@angular/core';
import { rxResource, toObservable } from '@angular/core/rxjs-interop';
import {
  signalStoreFeature,
  withComputed,
  withMethods,
  withProps,
} from '@ngrx/signals';
import { AUTH, onIdTokenChanged$ } from '@qarapace/ngfire/auth';
import { getIdTokenResult, ParsedToken, User } from 'firebase/auth';
import {
  catchError,
  distinctUntilChanged,
  filter,
  from,
  map,
  of,
  pipe,
  switchMap,
  take,
  tap,
} from 'rxjs';

/** Callbacks for auth action side-effects (sign-in, sign-out, etc.). */
export interface AsyncHandler {
  next?: () => void;
  error?: (err: Error) => void;
}

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
        /** Whether auth has settled (resolved, errored, or restored from local cache). */
        isReady: computed(() => {
          const status = store.authResource.status();
          return (
            status === 'resolved' || status === 'error' || status === 'local'
          );
        }),
        /** Whether a user is currently signed in. */
        isAuthenticated: computed(() => !!authData()),
        /** The current user's UID, or `null` when not authenticated. */
        uid: computed(() => authData()?.user?.uid ?? null),
      };
    }),

    withMethods((store) => {
      return {
        /**
         * Returns an observable that emits once when the auth state is ready, then completes.
         * Use this for initialization logic that needs to wait for authentication to be loaded.
         * For synchronous checks, prefer using the `isReady()` signal instead.
         *
         * @returns Observable that emits void once auth is ready and completes.
         */
        onReady() {
          return toObservable(store.isReady).pipe(filter(Boolean), take(1));
        },

        /**
         * Returns the current user's UID or throws if no user is authenticated.
         * Use this in contexts where authentication is guaranteed.
         *
         * @throws If the user is not authenticated.
         */
        expectUid() {
          const uid = store.authResource.value()?.user?.uid;
          if (!uid) {
            throw new Error('Expecting uid but user is not authenticated!');
          }
          return uid;
        },

        /**
         * @internal RxJS operator to pipe after every action that changes the auth state
         * (signIn, signOut, etc.). Reloads the auth resource and forwards to the
         * configured `errorHandler` and `AsyncHandler` callbacks.
         */
        _handleAuth: ({ next, error }: AsyncHandler) =>
          pipe(
            tap(() => {
              store.authResource.reload();
              next?.();
            }),
            catchError((err: Error) => {
              store.authResource.reload();
              onError?.(err);
              error?.(err);
              return of(null);
            })
          ),
      };
    })
  );
}
