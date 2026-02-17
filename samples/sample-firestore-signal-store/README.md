# sample-firestore-signal-store

Real-time Firestore document watching using `@qarapace/ngfire/firestore` with an ngrx signal store and `rxResource`.

## Architecture

The store watches the authenticated user's Firestore document (`users/{uid}`) and exposes it as Angular signals.

### Key concepts

1. **`onSnapshot$`** — shared observable wrapper around Firestore's `onSnapshot`. All subscribers share a single listener; late subscribers get the last snapshot immediately.

2. **`rxResource` with `params`** — the `params` option ties the resource to `AuthStore.uid()`. When the UID changes (sign-in, sign-out, account switch), `rxResource` automatically unsubscribes from the previous document and re-subscribes to the new one.

3. **No service layer** — the store injects `FIRESTORE` directly and builds the `DocumentReference` inline. For simple cases, this avoids an unnecessary abstraction.

### Signals

| Signal      | Type             | Description                                          |
| ----------- | ---------------- | ---------------------------------------------------- |
| `user`      | `User \| null`   | The current user's Firestore document data           |
| `isLoading` | `boolean`        | Whether the resource is currently loading            |
| `status`    | `ResourceStatus` | Resource lifecycle (`idle` → `loading` → `resolved`) |
| `error`     | `unknown`        | The last error, if the resource errored              |

## Why `onSnapshot$` is shared

Unlike `onIdTokenChanged$` (which is cold for `rxResource` reload semantics), `onSnapshot$` uses `sharedFirebaseListener`: all subscribers share a single Firestore listener. This is the right default for Firestore because multiple components often read the same document, and you want to avoid duplicate listeners.
