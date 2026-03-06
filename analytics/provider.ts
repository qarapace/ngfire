import { InjectionToken } from '@angular/core';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';
import { FirebaseApp, getApp } from 'firebase/app';
import { FIREBASE_APPS } from '../app/provider';
import { NgFireFeatureFn } from '../app/types';

// ---------------------------------------------------------------------------
// Injection Tokens
// ---------------------------------------------------------------------------

/**
 * All registered Analytics instances.
 */
export const ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>(
  'NgFire.AnalyticsInstances'
);

/**
 * The default Analytics instance.
 */
export const ANALYTICS = new InjectionToken<Analytics>('NgFire.Analytics');

/**
 * A promise that resolves to the Analytics instance if supported, or `null` otherwise.
 *
 * Use this when you want to defer analytics initialization until `isSupported()` resolves,
 * without blocking app startup.
 */
export const ANALYTICS_SUPPORTED = new InjectionToken<
  Promise<Analytics | null>
>('NgFire.AnalyticsSupported');

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function defaultAnalyticsFactory(providedInstances: Analytics[]): Analytics {
  return providedInstances.length === 1
    ? providedInstances[0]
    : getAnalytics(getApp());
}

// ---------------------------------------------------------------------------
// withAnalytics()
// ---------------------------------------------------------------------------

/**
 * Register an Analytics instance for the current app.
 *
 * Depends on `FIREBASE_APPS` to guarantee the app is initialized
 * before `getApp()` is called.
 *
 * @example
 * ```typescript
 * provideNgFire(config, withAnalytics())
 * ```
 */
export function withAnalytics(): NgFireFeatureFn {
  return (appName?: string) => [
    {
      provide: ANALYTICS_INSTANCES,
      multi: true,
      deps: [FIREBASE_APPS],
      useFactory: (_apps: FirebaseApp[]) => getAnalytics(getApp(appName)),
    },
    {
      provide: ANALYTICS,
      deps: [ANALYTICS_INSTANCES],
      useFactory: defaultAnalyticsFactory,
    },
    {
      provide: ANALYTICS_SUPPORTED,
      deps: [FIREBASE_APPS],
      useFactory: (_apps: FirebaseApp[]) =>
        isSupported().then((supported) =>
          supported ? getAnalytics(getApp(appName)) : null
        ),
    },
  ];
}
