import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  InjectionToken,
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { NgFireConfig, NgFireFeatureFn } from './types';

// ---------------------------------------------------------------------------
// Injection Tokens
// ---------------------------------------------------------------------------

/**
 * All registered Firebase app instances.
 *
 * Populated via `multi: true` — each `provideNgFire()` call adds one entry.
 * Other service factories depend on this token to ensure all apps are
 * initialized before any `getApp()` call.
 */
export const FIREBASE_APPS = new InjectionToken<FirebaseApp[]>(
  'NgFire.FirebaseApps'
);

/**
 * The default Firebase app instance.
 *
 * Resolution strategy:
 * - If only one app is registered → returns that app.
 * - If multiple apps are registered → returns the default app (`getApp()`).
 */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>(
  'NgFire.FirebaseApp'
);

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function defaultFirebaseAppFactory(providedApps: FirebaseApp[]): FirebaseApp {
  return providedApps.length === 1 ? providedApps[0] : getApp();
}

// ---------------------------------------------------------------------------
// provideNgFire()
// ---------------------------------------------------------------------------

/**
 * Provide a Firebase app instance at the application level.
 *
 * Can be called **multiple times** to register multiple Firebase apps.
 * Features (`withFirestore()`, `withAuth()`, etc.) are automatically bound
 * to the app being configured.
 *
 * @example
 * ```typescript
 * // Single app (most common)
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgFire(
 *       { firebase: environment.firebase },
 *       withFirestore(),
 *       withAuth(),
 *     ),
 *   ],
 * };
 *
 * // Multiple apps
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgFire(
 *       { firebase: environment.firebase },
 *       withFirestore(),
 *       withAuth(),
 *     ),
 *     provideNgFire(
 *       { firebase: environment.analyticsFirebase, appName: 'analytics' },
 *       withFirestore(),
 *     ),
 *   ],
 * };
 * ```
 */
export function provideNgFire(
  config: NgFireConfig,
  ...features: NgFireFeatureFn[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_APPS,
      multi: true,
      useFactory: () => initializeApp(config.firebase, config.appName),
    },
    {
      provide: FIREBASE_APP,
      deps: [FIREBASE_APPS],
      useFactory: defaultFirebaseAppFactory,
    },
    ...features.flatMap((f) => f(config.appName)),
  ]);
}
