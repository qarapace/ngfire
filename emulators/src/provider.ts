import { getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { FIREBASE_APPS } from '../../app/src/provider';
import { NgFireFeatureFn } from '../../app/src/types';
import { AUTH_INSTANCES } from '../../auth/src/provider';
import { FIRESTORE_INSTANCES } from '../../firestore/src/provider';
import { FUNCTIONS_INSTANCES } from '../../functions/src/provider';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface EmulatorConfig {
  firestore?: { host: string; port: number };
  auth?: { url: string };
  functions?: { host: string; port: number };
}

// ---------------------------------------------------------------------------
// withEmulators()
// ---------------------------------------------------------------------------

/**
 * Connect Firebase services to local emulators.
 *
 * **Prefer `provideFirebaseEmulators()`** in `environment.providers` —
 * it is tree-shaken out of production builds via file replacement.
 *
 * This feature function imports all Firebase product SDKs
 * (`firebase/auth`, `firebase/firestore`, `firebase/functions`),
 * so it is **not tree-shakable** — use only when bundle size is
 * not a concern.
 *
 * @example
 * ```typescript
 * provideNgFire(
 *   config,
 *   withFirestore(),
 *   withAuth(),
 *   withEmulators({
 *     firestore: { host: 'localhost', port: 8080 },
 *     auth: { url: 'http://localhost:9099' },
 *   }),
 * )
 * ```
 */
export function withEmulators(emulators: EmulatorConfig): NgFireFeatureFn {
  return (appName?: string) => [
    provideEnvironmentInitializer(() => {
      // Ensure all apps are initialized before calling getApp()
      inject(FIREBASE_APPS);

      const app = getApp(appName);

      if (emulators.firestore) {
        inject(FIRESTORE_INSTANCES); // ensure Firestore is created
        connectFirestoreEmulator(
          getFirestore(app),
          emulators.firestore.host,
          emulators.firestore.port
        );
      }
      if (emulators.auth) {
        inject(AUTH_INSTANCES); // ensure Auth is created
        connectAuthEmulator(getAuth(app), emulators.auth.url);
      }
      if (emulators.functions) {
        inject(FUNCTIONS_INSTANCES); // ensure Functions is created
        connectFunctionsEmulator(
          getFunctions(app),
          emulators.functions.host,
          emulators.functions.port
        );
      }
    }),
  ];
}

// ---------------------------------------------------------------------------
// provideFirebaseEmulators()
// ---------------------------------------------------------------------------

/**
 * Standalone `EnvironmentProviders` wrapper around `withEmulators()`.
 *
 * Delegates to `withEmulators()` so all `inject()` ordering guarantees
 * apply. Designed to be used in `environment.providers` so emulator code
 * is stripped at build time:
 *
 * @example
 * ```typescript
 * // environment.ts (dev only — replaced by environment.prod.ts at build)
 * import { provideFirebaseEmulators } from '@fo/ngfire/emulators';
 *
 * export const environment: Environment = {
 *   providers: [
 *     provideFirebaseEmulators({
 *       functions: { host: 'localhost', port: 5001 },
 *       firestore: { host: 'localhost', port: 8086 },
 *     }),
 *   ],
 * };
 * ```
 */
export function provideFirebaseEmulators(
  emulators: EmulatorConfig,
  appName?: string
): EnvironmentProviders {
  return makeEnvironmentProviders(withEmulators(emulators)(appName));
}
