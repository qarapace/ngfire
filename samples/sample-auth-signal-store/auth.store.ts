import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { exhaustMap, from, pipe, tap } from 'rxjs';
import { AsyncHandler, withNgAuth } from './with-auth-data.feature';

export interface MyClaims {
  admin?: boolean;
}

export interface AuthState {
  /** URL to navigate to after a successful login, or `null` if no redirect is pending. */
  afterLoginUrl: string | null;
}

const initialState: AuthState = {
  afterLoginUrl: null,
};

/**
 * Sample auth store demonstrating `@qarapace/ngfire/auth` usage with ngrx signal store.
 *
 * The store is composed of two layers:
 *
 * 1. **`withNgAuth`** — a reusable signal store feature (see `with-auth-data.feature.ts`)
 *    that wires `onIdTokenChanged$` into an `rxResource`. It exposes generic, project-agnostic
 *    signals (`user`, `claims`, `isAuthenticated`, `isLoading`, `uid`) and the raw `auth` instance.
 *    This feature can be dropped into any Angular project as-is.
 *
 * 2. **App-specific methods** — `signIn`, `signInWithGoogle`, `createAccount`, `signOut`,
 *    `redirectToLogin`, and the `afterLoginUrl` redirect hook. These are tailored to
 *    your application's auth flows, routes, and error handling.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },

  withNgAuth<MyClaims>({
    errorHandler: (err) => console.error(err),
  }),

  withState(initialState),

  withMethods((store) => {
    const router = inject(Router);

    return {
      /** Saves the target URL and redirects to the sign-in page. Call from a route guard to enforce authentication. */
      redirectToLogin(afterLoginUrl: string) {
        patchState(store, { afterLoginUrl });
        router.navigate(['/auth/sign-in']);
      },

      /** Signs in with email and password. */
      signIn: rxMethod<{ email: string; password: string } & AsyncHandler>(
        pipe(
          exhaustMap(({ email, password, ...handler }) =>
            from(signInWithEmailAndPassword(store.auth, email, password)).pipe(
              store._handleAuth(handler)
            )
          )
        )
      ),

      /** Signs in with a Google popup. */
      signInWithGoogle: rxMethod<AsyncHandler>(
        pipe(
          exhaustMap((handler) =>
            from(signInWithPopup(store.auth, new GoogleAuthProvider())).pipe(
              store._handleAuth(handler)
            )
          )
        )
      ),

      /** Creates a new account with email and password, then redirects to account settings. */
      createAccount: rxMethod<
        { email: string; password: string } & AsyncHandler
      >(
        pipe(
          tap(() => patchState(store, { afterLoginUrl: '/settings/account' })),
          exhaustMap(({ email, password, ...handler }) =>
            from(
              createUserWithEmailAndPassword(store.auth, email, password)
            ).pipe(store._handleAuth(handler))
          )
        )
      ),

      /** Signs out and redirects to the sign-in page. */
      signOut: rxMethod<void>(
        pipe(
          exhaustMap(() =>
            from(signOut(store.auth)).pipe(
              store._handleAuth({
                next: () => router.navigate(['/auth/sign-in']),
              })
            )
          )
        )
      ),
    };
  }),

  withHooks((store) => {
    const router = inject(Router);

    return {
      onInit() {
        // Navigate after login when auth resolves
        if (store.isAuthenticated() && store.afterLoginUrl()) {
          const url = store.afterLoginUrl()!;
          patchState(store, { afterLoginUrl: null });
          router.navigateByUrl(url);
        }
      },
    };
  })
);
