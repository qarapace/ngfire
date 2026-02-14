import { getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { InjectionToken } from '@angular/core';
import { FIREBASE_APPS } from '../../app/src/provider';
import { NgFireFeatureFn } from '../../app/src/types';

// ---------------------------------------------------------------------------
// Injection Tokens
// ---------------------------------------------------------------------------

/**
 * All registered Auth instances.
 */
export const AUTH_INSTANCES = new InjectionToken<Auth[]>(
  'NgFire.AuthInstances'
);

/**
 * The default Auth instance.
 */
export const AUTH = new InjectionToken<Auth>('NgFire.Auth');

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function defaultAuthFactory(providedInstances: Auth[]): Auth {
  return providedInstances.length === 1
    ? providedInstances[0]
    : getAuth(getApp());
}

// ---------------------------------------------------------------------------
// withAuth()
// ---------------------------------------------------------------------------

/**
 * Register an Auth instance for the current app.
 *
 * Depends on `FIREBASE_APPS` to guarantee the app is initialized
 * before `getApp()` is called.
 */
export function withAuth(): NgFireFeatureFn {
  return (appName?: string) => [
    {
      provide: AUTH_INSTANCES,
      multi: true,
      deps: [FIREBASE_APPS],
      useFactory: (_apps: FirebaseApp[]) => getAuth(getApp(appName)),
    },
    {
      provide: AUTH,
      deps: [AUTH_INSTANCES],
      useFactory: defaultAuthFactory,
    },
  ];
}
