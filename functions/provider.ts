import { InjectionToken } from '@angular/core';
import { FirebaseApp, getApp } from 'firebase/app';
import { Functions, getFunctions } from 'firebase/functions';
import { FIREBASE_APPS } from '../app/provider';
import { NgFireFeatureFn } from '../app/types';

// ---------------------------------------------------------------------------
// Injection Tokens
// ---------------------------------------------------------------------------

/**
 * All registered Functions instances.
 */
export const FUNCTIONS_INSTANCES = new InjectionToken<Functions[]>(
  'NgFire.FunctionsInstances'
);

/**
 * The default Functions instance.
 */
export const FUNCTIONS = new InjectionToken<Functions>('NgFire.Functions');

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function defaultFunctionsFactory(providedInstances: Functions[]): Functions {
  return providedInstances.length === 1
    ? providedInstances[0]
    : getFunctions(getApp());
}

// ---------------------------------------------------------------------------
// withFunctions()
// ---------------------------------------------------------------------------

export interface FunctionsConfig {
  region?: string;
}

/**
 * Register a Functions instance for the current app.
 *
 * Depends on `FIREBASE_APPS` to guarantee the app is initialized
 * before `getApp()` is called.
 *
 * @example
 * ```typescript
 * provideNgFire(config, withFunctions({ region: 'europe-west1' }))
 * ```
 */
export function withFunctions(config?: FunctionsConfig): NgFireFeatureFn {
  return (appName?: string) => [
    {
      provide: FUNCTIONS_INSTANCES,
      multi: true,
      deps: [FIREBASE_APPS],
      useFactory: (_apps: FirebaseApp[]) =>
        getFunctions(getApp(appName), config?.region),
    },
    {
      provide: FUNCTIONS,
      deps: [FUNCTIONS_INSTANCES],
      useFactory: defaultFunctionsFactory,
    },
  ];
}
