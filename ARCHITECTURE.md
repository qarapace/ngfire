# Architecture

## Package Structure

ngfire is a single npm package with **secondary entry points** — one per Firebase product:

```
ngfire
├── /app         → core: FirebaseApp, config, shared RxJS helpers
├── /analytics   → Analytics providers
├── /firestore   → Firestore providers and helpers
├── /auth        → Auth providers and helpers
├── /functions   → Functions providers
└── /emulators   → Emulator connection (cross-cutting, dev-only)
```

Consumer imports:

```typescript
import { withAnalytics, ANALYTICS } from '@qarapace/ngfire/analytics';
import { provideNgFire, fromFirebaseListener } from '@qarapace/ngfire/app';
import { withAuth, AUTH, onIdTokenChanged$ } from '@qarapace/ngfire/auth';
import { withFirestore, FIRESTORE, onSnapshot$ } from '@qarapace/ngfire/firestore';
import { withFunctions, FUNCTIONS } from '@qarapace/ngfire/functions';
```

## Tree-Shaking Strategy

### 1. Secondary entry points (structural isolation)

Each Firebase product is a separate entry point with its own `index.ts`. If an app only imports `@qarapace/ngfire/firestore`, the code for auth and functions is **never included in the bundle**.

These map to `exports` in `package.json`:

```json
{
  "exports": {
    "./analytics": "./dist/analytics/index.js",
    "./app": "./dist/app/index.js",
    "./firestore": "./dist/firestore/index.js",
    "./auth": "./dist/auth/index.js",
    "./functions": "./dist/functions/index.js",
    "./emulators": "./dist/emulators/index.js"
  }
}
```

### 2. ES modules

The library uses ESM (`import`/`export`), not CommonJS (`require`). Tree-shaking relies on static analysis of import graphs, which is only possible with ES module syntax.

### 3. `sideEffects: false`

The `package.json` declares `"sideEffects": false`, telling bundlers that any unused export can be safely eliminated.

### 4. Standalone functions over classes

```typescript
// Each function is an independent export — unused ones are eliminated
export function onSnapshot$<T>(ref: DocumentReference<T>) { ... }
export function onIdTokenChanged$(auth: Auth) { ... }
```

Class methods form an indivisible unit — importing a class pulls in all its methods. Standalone functions are individually tree-shakable within an entry point.

### 5. No "god barrel"

There is no root `index.ts` re-exporting everything. Each entry point is self-contained.

## Directory Layout

Each entry point follows a consistent internal structure:

```
├── app/
│   ├── index.ts        ← public API
│   ├── provider.ts     ← provideNgFire(), tokens
│   ├── helpers.ts      ← fromFirebaseListener(), sharedFirebaseListener()
│   └── types.ts        ← NgFireConfig, NgFireFeatureFn
├── analytics/
│   ├── index.ts
│   └── provider.ts     ← withAnalytics(), ANALYTICS
├── firestore/
│   ├── index.ts
│   ├── provider.ts     ← withFirestore(), FIRESTORE
│   └── helpers.ts      ← onSnapshot$()
├── auth/
│   ├── index.ts
│   ├── provider.ts     ← withAuth(), AUTH
│   └── helpers.ts      ← onAuthStateChanged$(), onIdTokenChanged$()
├── functions/
│   ├── index.ts
│   └── provider.ts     ← withFunctions(), FUNCTIONS
├── emulators/
│   ├── index.ts
│   └── provider.ts     ← withEmulators(), EmulatorConfig
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## Dependency Graph

Entry points depend on `app`, but never on each other:

```
ngfire/analytics  → ngfire/app
ngfire/firestore  → ngfire/app
ngfire/auth       → ngfire/app
ngfire/functions  → ngfire/app

ngfire/firestore  ✗→  ngfire/auth      (never)
ngfire/auth       ✗→  ngfire/functions  (never)
```

This guarantees that importing one product never pulls in another.

## Emulator Connection

Two approaches are available. Choose based on your tree-shaking needs.

### Recommended: `provideFirebaseEmulators()` (zero prod overhead)

Place emulator connection in the environment file using the `provideFirebaseEmulators()` helper. Since Angular CLI replaces `environment.ts` with `environment.prod.ts` at build time, emulator imports never reach the production bundle:

```typescript
// environment.ts (dev)
import { provideFirebaseEmulators } from '@qarapace/ngfire/emulators';

export const environment: Environment = {
  // ...
  providers: [
    provideFirebaseEmulators({
      functions: { host: 'localhost', port: 5001 },
      firestore: { host: 'localhost', port: 8086 },
    }),
  ],
};

// environment.prod.ts — no providers field
```

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebase(),
    // ...
    ...(environment.providers ?? []),
  ],
};
```

This pattern extends beyond emulators — any dev-only provider (ngrx devtools, logging, etc.) can live in `environment.providers`.

### Alternative: `withEmulators()` (convenience)

The `@qarapace/ngfire/emulators` entry point provides a declarative API for quick setup. Note that it imports all Firebase product SDKs (`firebase/auth`, `firebase/firestore`, `firebase/functions`), so it is **not tree-shakable** — use only in dev or when bundle size is not a concern:

```typescript
provideNgFire(
  config,
  withFirestore(),
  withAuth(),
  withEmulators({
    firestore: { host: 'localhost', port: 8080 },
    auth: { url: 'http://localhost:9099' },
  })
);
```
