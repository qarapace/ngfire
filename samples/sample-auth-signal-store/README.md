# sample-auth-signal-store

Full auth state management using `@qarapace/ngfire/auth` with an ngrx signal store and `rxResource`.

## Architecture

The store is split into two layers:

### 1. Reusable feature: `withNgAuth` ([with-auth-data.feature.ts](./with-auth-data.feature.ts))

A generic signal store feature that can be dropped into any Angular project. It wires `onIdTokenChanged$` (cold observable) into an `rxResource` and exposes:

| Signal            | Type             | Description                                       |
| ----------------- | ---------------- | ------------------------------------------------- |
| `auth`            | `Auth`           | The Firebase Auth instance                        |
| `authResource`    | `ResourceRef`    | The underlying reactive resource                  |
| `user`            | `User \| null`   | Current Firebase user                             |
| `claims`          | `Claims \| null` | Custom claims from the ID token (type-safe)       |
| `isAuthenticated` | `boolean`        | Whether a user is signed in                       |
| `isLoading`       | `boolean`        | Whether auth is resolving (initial load, refresh) |
| `uid`             | `string \| null` | Current user's UID                                |

The `Claims` type parameter lets you type your custom claims:

```typescript
interface MyClaims {
  admin?: boolean;
}

withNgAuth<MyClaims>({ errorHandler: (err) => console.error(err) });
```

### 2. App-specific store: `AuthStore` ([auth.store.ts](./auth.store.ts))

Composes `withNgAuth` with application-specific auth methods:

- `signIn`: email/password authentication
- `signInWithGoogle`: Google popup sign-in
- `createAccount`: email/password registration
- `signOut`: sign out and redirect
- `redirectToLogin`: save target URL and redirect to sign-in (for route guards)

## Why `onIdTokenChanged$` is cold

The `onIdTokenChanged$` observable from ngfire is **cold**: each subscriber gets its own Firebase listener. This is intentional: `rxResource` needs to reflect the full `loading -> resolved` lifecycle on every `reload()`. A shared observable would return the cached value immediately, skipping the loading state.
