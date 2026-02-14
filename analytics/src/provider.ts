import { getAnalytics, Analytics } from 'firebase/analytics';
import { getApp, FirebaseApp } from 'firebase/app';
import { InjectionToken } from '@angular/core';
import { FIREBASE_APPS } from '../../app/src/provider';
import { NgFireFeatureFn } from '../../app/src/types';

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
  ];
}
