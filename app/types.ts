import { EnvironmentProviders, Provider } from '@angular/core';
import { FirebaseOptions } from 'firebase/app';

export interface NgFireConfig {
  firebase: FirebaseOptions;
  appName?: string;
}

/**
 * A feature is a function that receives the `appName` from the parent
 * `provideNgFire()` call and returns the corresponding providers.
 *
 * This ensures each feature binds to the correct Firebase app instance,
 * even in multi-app setups.
 */
export type NgFireFeatureFn = (
  appName?: string
) => (Provider | EnvironmentProviders)[];
