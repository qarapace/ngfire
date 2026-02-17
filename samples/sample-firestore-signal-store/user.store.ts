import { computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { FIRESTORE, onSnapshot$ } from '@qarapace/ngfire/firestore';
import { doc, DocumentReference } from 'firebase/firestore';
import { map, of } from 'rxjs';
import { AuthStore } from '../sample-auth-signal-store/auth.store';

/** Application-specific user model. Replace with your own Firestore document shape. */
export interface User {
  displayName: string;
  email: string;
  photoURL: string | null;
}

/** Collection name in Firestore. */
const USERS = 'users';

/**
 * Sample store demonstrating `@qarapace/ngfire/firestore` usage with ngrx signal store.
 *
 * Watches the authenticated user's Firestore document in real time using
 * `onSnapshot$` and bridges the result into signals via `rxResource`.
 *
 * The `params` option ties the resource to `AuthStore.uid()`: when the UID
 * changes (sign-in, sign-out, account switch), the resource automatically
 * re-subscribes to the correct document.
 */
export const UserStore = signalStore(
  { providedIn: 'root' },

  withProps(() => {
    const firestore = inject(FIRESTORE);
    const auth = inject(AuthStore);

    return {
      userResource: rxResource({
        params: () => auth.uid(),
        stream: ({ params: uid }) => {
          if (!uid) return of(null);
          const ref = doc(firestore, USERS, uid) as DocumentReference<User>;
          return onSnapshot$(ref).pipe(map((snap) => snap.data()));
        },
      }),
    };
  }),

  withComputed((store) => ({
    /** The current user's Firestore document data, or `null` when not available. */
    user: computed(() =>
      store.userResource.hasValue()
        ? (store.userResource.value() ?? null)
        : null
    ),
    /** Whether the Firestore resource is currently loading. */
    isLoading: store.userResource.isLoading,
    /** The resource status signal. */
    status: store.userResource.status,
    /** The last error, if the resource errored. */
    error: store.userResource.error,
  }))
);

export type UserStore = InstanceType<typeof UserStore>;
