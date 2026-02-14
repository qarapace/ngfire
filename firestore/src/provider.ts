import { getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { InjectionToken } from '@angular/core';
import { FIREBASE_APPS } from '../../app/src/provider';
import { NgFireFeatureFn } from '../../app/src/types';

// ---------------------------------------------------------------------------
// Injection Tokens
// ---------------------------------------------------------------------------

/**
 * All registered Firestore instances.
 *
 * Populated via `multi: true` — each `withFirestore()` call adds one entry.
 */
export const FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>(
  'NgFire.FirestoreInstances'
);

/**
 * The default Firestore instance.
 *
 * Resolution strategy:
 * - If only one instance is registered → returns that instance.
 * - If multiple instances → returns the one from the default app.
 */
export const FIRESTORE = new InjectionToken<Firestore>('NgFire.Firestore');

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function defaultFirestoreFactory(providedInstances: Firestore[]): Firestore {
  return providedInstances.length === 1
    ? providedInstances[0]
    : getFirestore(getApp());
}

// ---------------------------------------------------------------------------
// withFirestore()
// ---------------------------------------------------------------------------

/**
 * Register a Firestore instance for the current app.
 *
 * Depends on `FIREBASE_APPS` to guarantee the app is initialized
 * before `getApp()` is called.
 *
 * @example
 * ```typescript
 * provideNgFire({ firebase: environment.firebase }, withFirestore())
 * ```
 */
export function withFirestore(): NgFireFeatureFn {
  return (appName?: string) => [
    {
      provide: FIRESTORE_INSTANCES,
      multi: true,
      deps: [FIREBASE_APPS],
      useFactory: (
        // TODO: depends on AUTH_INSTANCES — Firestore works better if Auth is loaded first
        // TODO: depends on APP_CHECK_INSTANCES
        _apps: FirebaseApp[]
      ) => getFirestore(getApp(appName)),
    },
    {
      provide: FIRESTORE,
      deps: [FIRESTORE_INSTANCES],
      useFactory: defaultFirestoreFactory,
    },
  ];
}
